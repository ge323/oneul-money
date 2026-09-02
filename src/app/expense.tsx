import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';

const BUDGET_KEY = 'budget-settings';
const EXPENSES_KEY = 'expenses';
const CUSTOM_CATEGORIES_KEY = 'custom-categories';

type BudgetSettings = {
  monthlyBudget: number;
  fixedExpense: number;
  savingGoal: number;
  spentAmount: number;
  payday?: number;
  paydayType?: 'date' | 'lastDay';
};

type Category = {
  id: string;
  label: string;
  emoji: string;
  custom?: boolean;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    label: '식비',
    emoji: '🍚',
  },
  {
    id: 'cafe',
    label: '카페',
    emoji: '☕',
  },
  {
    id: 'transport',
    label: '교통',
    emoji: '🚇',
  },
  {
    id: 'shopping',
    label: '쇼핑',
    emoji: '🛍️',
  },
  {
    id: 'leisure',
    label: '여가',
    emoji: '🎮',
  },
  {
    id: 'life',
    label: '생활',
    emoji: '🏠',
  },
  {
    id: 'etc',
    label: '기타',
    emoji: '📦',
  },
];

export default function ExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');

  const [customCategories, setCustomCategories] =
    useState<Category[]>([]);

  const [showCategoryModal, setShowCategoryModal] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState('');

  const [newCategoryEmoji, setNewCategoryEmoji] =
    useState('');

  // Bottom Sheet 위치
  const slideAnim = useRef(
    new Animated.Value(420)
  ).current;

  // 검은 배경 투명도
  const backdropOpacity = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    loadCustomCategories();
  }, []);

  const loadCustomCategories = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        CUSTOM_CATEGORIES_KEY
      );

      if (!saved) {
        return;
      }

      setCustomCategories(JSON.parse(saved));
    } catch (error) {
      console.error(
        '카테고리 불러오기 실패:',
        error
      );
    }
  };

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ];

  const formatMoneyInput = (text: string) => {
    const numbersOnly = text.replace(
      /[^0-9]/g,
      ''
    );

    if (!numbersOnly) {
      return '';
    }

    return Number(
      numbersOnly
    ).toLocaleString('ko-KR');
  };

  const parseMoney = (text: string) => {
    return (
      Number(
        text.replace(/,/g, '')
      ) || 0
    );
  };

  // =========================
  // 모달 열기
  // =========================

  const openCategoryModal = () => {
    slideAnim.setValue(420);
    backdropOpacity.setValue(0);

    setShowCategoryModal(true);

    requestAnimationFrame(() => {
      Animated.parallel([
        // 하얀 Bottom Sheet
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),

        // 검은 배경
        Animated.timing(
          backdropOpacity,
          {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }
        ),
      ]).start();
    });
  };

  // =========================
  // 모달 닫기
  // =========================

  const closeCategoryModal = () => {
    Animated.parallel([
      // 하얀 Bottom Sheet는 천천히 내려감
      Animated.timing(slideAnim, {
        toValue: 420,
        duration: 200,
        useNativeDriver: true,
      }),

      // 검은 배경은 빠르게 사라짐
      Animated.timing(
        backdropOpacity,
        {
          toValue: 0,

          // ★ 검은 배경 Fade Out 속도
          duration: 60,

          useNativeDriver: true,
        }
      ),
    ]).start(() => {
      setShowCategoryModal(false);

      setNewCategoryName('');
      setNewCategoryEmoji('');
    });
  };

  // =========================
  // 사용자 카테고리 추가
  // =========================

  const addCustomCategory = async () => {
    const name = newCategoryName.trim();
    const emoji = newCategoryEmoji.trim();

    if (!name) {
      return;
    }

    const newCategory: Category = {
      id: `custom-${Date.now()}`,
      label: name,
      emoji: emoji || '✨',
      custom: true,
    };

    const updatedCategories = [
      ...customCategories,
      newCategory,
    ];

    try {
      await AsyncStorage.setItem(
        CUSTOM_CATEGORIES_KEY,
        JSON.stringify(
          updatedCategories
        )
      );

      setCustomCategories(
        updatedCategories
      );

      // 새 카테고리를 바로 선택
      setCategory(newCategory.id);

      setNewCategoryName('');
      setNewCategoryEmoji('');

      // 추가 완료 후에도
      // 동일한 닫기 애니메이션 적용
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 420,
          duration: 180,
          useNativeDriver: true,
        }),

        Animated.timing(
          backdropOpacity,
          {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }
        ),
      ]).start(() => {
        setShowCategoryModal(false);
      });
    } catch (error) {
      console.error(
        '카테고리 저장 실패:',
        error
      );
    }
  };

  // =========================
  // 지출 저장
  // =========================

  const saveExpense = async () => {
    const numericAmount =
      parseMoney(amount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      return;
    }

    try {
      const savedExpenses =
        await AsyncStorage.getItem(
          EXPENSES_KEY
        );

      const expenses: Expense[] =
        savedExpenses
          ? JSON.parse(savedExpenses)
          : [];

      const newExpense: Expense = {
        id: Date.now().toString(),

        title:
          title.trim() || '지출',

        amount: numericAmount,

        category,

        createdAt:
          new Date().toISOString(),
      };

      const updatedExpenses = [
        newExpense,
        ...expenses,
      ];

      await AsyncStorage.setItem(
        EXPENSES_KEY,
        JSON.stringify(
          updatedExpenses
        )
      );

      const savedBudget =
        await AsyncStorage.getItem(
          BUDGET_KEY
        );

      if (savedBudget) {
        const budget: BudgetSettings =
          JSON.parse(savedBudget);

        const updatedBudget = {
          ...budget,

          spentAmount:
            (Number(
              budget.spentAmount
            ) || 0) +
            numericAmount,
        };

        await AsyncStorage.setItem(
          BUDGET_KEY,
          JSON.stringify(
            updatedBudget
          )
        );
      }

      router.back();
    } catch (error) {
      console.error(
        '지출 저장 실패:',
        error
      );
    }
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          title="지출 기록"
          description="오늘 사용한 금액을 기록해보세요."
        />

        <View style={styles.form}>
          {/* 금액 */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              얼마를 썼나요?
            </Text>

            <View
              style={
                styles.amountInputBox
              }
            >
              <TextInput
                style={
                  styles.amountInput
                }
                value={amount}
                onChangeText={(text) =>
                  setAmount(
                    formatMoneyInput(
                      text
                    )
                  )
                }
                placeholder="0"
                keyboardType="numeric"
              />

              <Text style={styles.unit}>
                원
              </Text>
            </View>
          </View>

          {/* 사용처 */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              어디에 썼나요?
            </Text>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="예: 점심"
            />
          </View>

          {/* 카테고리 */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              카테고리
            </Text>

            <View
              style={
                styles.categoryContainer
              }
            >
              {allCategories.map(
                (item) => {
                  const isSelected =
                    category === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.categoryButton,

                        isSelected &&
                          styles.categoryButtonSelected,
                      ]}
                      onPress={() =>
                        setCategory(
                          item.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.categoryEmoji
                        }
                      >
                        {item.emoji}
                      </Text>

                      <Text
                        style={[
                          styles.categoryText,

                          isSelected &&
                            styles.categoryTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                }
              )}

              {/* 카테고리 추가 */}

              <Pressable
                style={[
                  styles.categoryButton,
                  styles.addCategoryButton,
                ]}
                onPress={
                  openCategoryModal
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="#3563C9"
                />

                <Text
                  style={
                    styles.addCategoryText
                  }
                >
                  추가
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 기록 */}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,

            pressed &&
              styles.saveButtonPressed,
          ]}
          onPress={saveExpense}
        >
          <Text
            style={
              styles.saveButtonText
            }
          >
            기록하기
          </Text>
        </Pressable>
      </ScrollView>

      {/* ========================= */}
      {/* 카테고리 Bottom Sheet */}
      {/* ========================= */}

      <Modal
        visible={showCategoryModal}
        transparent

        // Modal 자체 애니메이션 제거
        animationType="none"

        statusBarTranslucent

        onRequestClose={
          closeCategoryModal
        }
      >
        <View style={styles.modalRoot}>
          {/* ========================= */}
          {/* 검은 배경 */}
          {/* ========================= */}

          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity:
                  backdropOpacity,
              },
            ]}
          >
            <Pressable
              style={
                styles.backdropPressArea
              }
              onPress={
                closeCategoryModal
              }
            />
          </Animated.View>

          {/* ========================= */}
          {/* 하얀 Bottom Sheet */}
          {/* ========================= */}

          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [
                  {
                    translateY:
                      slideAnim,
                  },
                ],
              },
            ]}
          >
            {/* 손잡이 */}

            <View
              style={
                styles.sheetHandle
              }
            />

            {/* 헤더 */}

            <View
              style={
                styles.sheetHeader
              }
            >
              <View
                style={
                  styles.sheetTitleArea
                }
              >
                <Text
                  style={
                    styles.sheetTitle
                  }
                >
                  새 카테고리
                </Text>

                <Text
                  style={
                    styles.sheetDescription
                  }
                >
                  자주 사용하는 소비 항목을 직접 만들어보세요.
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={
                  closeCategoryModal
                }
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#687386"
                />
              </Pressable>
            </View>

            {/* 아이콘 */}

            <Text
              style={
                styles.sheetLabel
              }
            >
              아이콘
            </Text>

            <View
              style={
                styles.emojiRow
              }
            >
              <View
                style={
                  styles.modalEmojiInputBox
                }
              >
                <TextInput
                  style={
                    styles.modalEmojiInput
                  }
                  value={
                    newCategoryEmoji
                  }
                  onChangeText={
                    setNewCategoryEmoji
                  }
                  placeholder="✨"
                  maxLength={4}
                />
              </View>

              <Text
                style={
                  styles.emojiDescription
                }
              >
                원하는 이모지를 입력해주세요.
              </Text>
            </View>

            {/* 카테고리 이름 */}

            <Text
              style={[
                styles.sheetLabel,
                styles.categoryNameLabel,
              ]}
            >
              카테고리 이름
            </Text>

            <TextInput
              style={
                styles.modalCategoryNameInput
              }
              value={
                newCategoryName
              }
              onChangeText={
                setNewCategoryName
              }
              placeholder="예: 반려동물"
              maxLength={10}
            />

            {/* 추가 */}

            <Pressable
              style={({ pressed }) => [
                styles.categorySaveButton,

                pressed &&
                  styles.categorySaveButtonPressed,
              ]}
              onPress={
                addCustomCategory
              }
            >
              <Text
                style={
                  styles.categorySaveButtonText
                }
              >
                추가하기
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 50,
  },

  form: {
    gap: 28,
  },

  inputGroup: {
    gap: 10,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },

  // =========================
  // 금액 입력
  // =========================

  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F1F5FC',

    borderRadius: 16,

    paddingHorizontal: 18,
  },

  amountInput: {
    flex: 1,

    paddingVertical: 18,

    fontSize: 28,
    fontWeight: '800',

    color: '#3563C9',
  },

  unit: {
    marginLeft: 8,

    fontSize: 15,
    fontWeight: '700',

    color: '#687386',
  },

  input: {
    backgroundColor: '#F5F7FA',

    borderRadius: 16,

    paddingHorizontal: 16,
    paddingVertical: 16,

    fontSize: 16,

    color: '#172033',
  },

  // =========================
  // 카테고리
  // =========================

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 10,
  },

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    backgroundColor: '#F5F7FA',

    borderRadius: 14,

    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  categoryButtonSelected: {
    backgroundColor: '#E7EEFC',
  },

  categoryEmoji: {
    fontSize: 18,
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',

    color: '#687386',
  },

  categoryTextSelected: {
    color: '#3563C9',
    fontWeight: '700',
  },

  addCategoryButton: {
    borderWidth: 1,

    borderColor: '#DCE5F5',

    backgroundColor: '#FFFFFF',
  },

  addCategoryText: {
    fontSize: 14,
    fontWeight: '700',

    color: '#3563C9',
  },

  // =========================
  // 기록 버튼
  // =========================

  saveButton: {
    marginTop: 36,

    backgroundColor: '#3563C9',

    borderRadius: 16,

    paddingVertical: 17,

    alignItems: 'center',
  },

  saveButtonPressed: {
    backgroundColor: '#294FA5',
  },

  saveButtonText: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '700',
  },

  // =========================
  // Bottom Sheet
  // =========================

  modalRoot: {
    flex: 1,

    justifyContent: 'flex-end',
  },

  // 검은 배경
  backdrop: {
    position: 'absolute',

    top: 0,
    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor:
      'rgba(23, 32, 51, 0.38)',
  },

  backdropPressArea: {
    flex: 1,
  },

  // 하얀 Bottom Sheet
  bottomSheet: {
    backgroundColor: '#FFFFFF',

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: -5,
    },

    shadowOpacity: 0.1,
    shadowRadius: 18,

    elevation: 12,
  },

  sheetHandle: {
    alignSelf: 'center',

    width: 44,
    height: 5,

    borderRadius: 999,

    backgroundColor: '#D7DDE6',

    marginBottom: 22,
  },

  sheetHeader: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'flex-start',

    marginBottom: 26,
  },

  sheetTitleArea: {
    flex: 1,

    paddingRight: 14,
  },

  sheetTitle: {
    fontSize: 22,

    fontWeight: '800',

    color: '#172033',
  },

  sheetDescription: {
    marginTop: 7,

    fontSize: 13,

    lineHeight: 19,

    color: '#8792A2',
  },

  closeButton: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: '#F5F7FA',

    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetLabel: {
    fontSize: 14,

    fontWeight: '700',

    color: '#172033',

    marginBottom: 9,
  },

  emojiRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  modalEmojiInputBox: {
    width: 72,
    height: 60,

    borderRadius: 16,

    backgroundColor: '#F5F7FA',

    alignItems: 'center',
    justifyContent: 'center',
  },

  modalEmojiInput: {
    width: '100%',

    fontSize: 26,

    textAlign: 'center',
  },

  emojiDescription: {
    flex: 1,

    marginLeft: 12,

    fontSize: 12,

    color: '#8792A2',
  },

  categoryNameLabel: {
    marginTop: 24,
  },

  modalCategoryNameInput: {
    backgroundColor: '#F5F7FA',

    borderRadius: 16,

    paddingHorizontal: 16,
    paddingVertical: 16,

    fontSize: 16,

    color: '#172033',
  },

  categorySaveButton: {
    marginTop: 28,

    backgroundColor: '#3563C9',

    borderRadius: 16,

    paddingVertical: 17,

    alignItems: 'center',
  },

  categorySaveButtonPressed: {
    backgroundColor: '#294FA5',
  },

  categorySaveButtonText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '700',
  },
});