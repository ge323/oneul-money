import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const {
    height: screenHeight,
  } = useWindowDimensions();

  /*
   * 기본 탭바 높이
   *
   * 작은 화면에서도 최소 78 확보
   * 큰 화면에서도 88 이상 커지지 않도록 제한
   */
  const baseTabBarHeight =
    Math.min(
      Math.max(
        screenHeight * 0.085,
        78
      ),
      88
    );

  /*
   * Android 하단 제스처 영역까지 포함
   */
  const bottomSafeArea =
    Math.max(
      insets.bottom,
      8
    );

  const totalTabBarHeight =
    baseTabBarHeight +
    bottomSafeArea;

  /*
   * 중앙 + 버튼
   */
  const centerButtonSize =
    Math.min(
      Math.max(
        screenHeight * 0.062,
        56
      ),
      62
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          '#3563C9',

        tabBarInactiveTintColor:
          '#66758A',

        tabBarHideOnKeyboard: true,

        tabBarStyle: [
          styles.tabBar,
          {
            height:
              totalTabBarHeight,

            paddingTop: 9,

            paddingBottom:
              bottomSafeArea,
          },
        ],

        tabBarItemStyle:
          styles.tabItem,

        tabBarLabelStyle:
          styles.tabLabel,
      }}
    >
      {/* 홈 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'home'
                  : 'home-outline'
              }
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* 내역 */}
      <Tabs.Screen
        name="history"
        options={{
          title: '내역',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'receipt'
                  : 'receipt-outline'
              }
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* 가운데 지출 추가 버튼 */}
      <Tabs.Screen
        name="expense-button"
        options={{
          title: '',

          tabBarButton: () => (
            <View
              style={
                styles.centerButtonWrapper
              }
            >
              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.centerButton,

                  {
                    width:
                      centerButtonSize,

                    height:
                      centerButtonSize,

                    borderRadius:
                      centerButtonSize /
                      2,

                    transform: [
                      {
                        translateY:
                          -centerButtonSize *
                          0.18,
                      },

                      {
                        scale:
                          pressed
                            ? 0.96
                            : 1,
                      },
                    ],
                  },
                ]}
                onPress={() =>
                  router.push(
                    '/expense'
                  )
                }
              >
                <Ionicons
                  name="add"
                  size={32}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* 계획 */}
      <Tabs.Screen
        name="plan"
        options={{
          title: '계획',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'calendar'
                  : 'calendar-outline'
              }
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* 설정 */}
      <Tabs.Screen
        name="setting-tab"
        options={{
          title: '설정',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'settings'
                  : 'settings-outline'
              }
              size={25}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles =
  StyleSheet.create({
    tabBar: {
      backgroundColor:
        '#FFFFFF',

      borderTopWidth: 1,

      borderTopColor:
        '#E3E8EF',

      overflow:
        'visible',

      elevation: 10,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: -2,
      },

      shadowOpacity: 0.07,

      shadowRadius: 8,
    },

    /*
     * 아이콘 + 글자가 들어가는
     * 탭 하나의 영역
     */
    tabItem: {
      paddingTop: 1,

      paddingBottom: 2,

      justifyContent:
        'center',

      overflow:
        'visible',
    },

    /*
     * lineHeight를 명시해야
     * 일부 Android / Web 환경에서
     * 글자 아래가 잘리지 않음
     */
    tabLabel: {
      fontSize: 12,

      lineHeight: 17,

      fontFamily:
        'Pretendard-SemiBold',

      marginTop: 2,

      marginBottom: 1,

      includeFontPadding:
        false,
    },

    centerButtonWrapper: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      overflow:
        'visible',

      paddingBottom: 4,
    },

    centerButton: {
      backgroundColor:
        '#3563C9',

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.18,

      shadowRadius: 9,

      elevation: 9,
    },
  });