import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, router } from 'expo-router';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const screenHeight =
    Dimensions.get('window').height;

  // 화면 높이에 따라 반응형으로 조정
  const baseTabBarHeight = Math.min(
    Math.max(screenHeight * 0.085, 64),
    82
  );

  const totalTabBarHeight =
    baseTabBarHeight + insets.bottom;

  const centerButtonSize = Math.min(
    Math.max(screenHeight * 0.065, 54),
    62
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          '#3563C9',

        tabBarInactiveTintColor:
          '#7A8799',

        tabBarStyle: [
          styles.tabBar,

          {
            height:
              totalTabBarHeight,

            paddingBottom:
              Math.max(
                insets.bottom,
                8
              ),

            paddingTop:
              Math.max(
                baseTabBarHeight *
                  0.08,
                6
              ),
          },
        ],

        tabBarLabelStyle:
          styles.tabLabel,

        tabBarItemStyle:
          styles.tabItem,
      }}
    >
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
              size={24}
              color={color}
            />
          ),
        }}
      />

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
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="expense-button"
        options={{
          title: '',

          tabBarButton: () => (
            <View
              style={[
                styles.centerButtonWrapper,

                {
                  height:
                    totalTabBarHeight,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.centerButton,

                  {
                    width:
                      centerButtonSize,

                    height:
                      centerButtonSize,

                    borderRadius:
                      centerButtonSize /
                      2,

                    top:
                      -centerButtonSize *
                      0.22,
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
                  size={
                    centerButtonSize *
                    0.52
                  }
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          ),
        }}
      />

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
              size={24}
              color={color}
            />
          ),
        }}
      />

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
              size={24}
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

      elevation: 8,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: -2,
      },

      shadowOpacity: 0.06,

      shadowRadius: 6,
    },

    tabItem: {
      justifyContent:
        'center',
    },

    tabLabel: {
      fontSize: 12,

      fontFamily:
        'Pretendard-SemiBold',

      marginTop: 2,
    },

    centerButtonWrapper: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    centerButton: {
      position:
        'relative',

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

      shadowOpacity: 0.16,

      shadowRadius: 8,

      elevation: 8,
    },
  });