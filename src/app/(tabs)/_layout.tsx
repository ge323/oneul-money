import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:
          '#3563C9',
        tabBarInactiveTintColor:
          '#98A2B3',
        tabBarStyle:
          styles.tabBar,
        tabBarLabelStyle:
          styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'home'
                  : 'home-outline'
              }
              size={size}
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
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'receipt'
                  : 'receipt-outline'
              }
              size={size}
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
              style={
                styles.centerButtonWrapper
              }
            >
              <Pressable
                style={
                  styles.centerButton
                }
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

      <Tabs.Screen
        name="plan"
        options={{
          title: '계획',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'calendar'
                  : 'calendar-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
          name="setting-tab"
          options={{
            title: '설정',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={size}
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
      height: 78,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor:
        '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor:
        '#EEF1F5',
    },

    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
    },

    centerButtonWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    centerButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        '#3563C9',
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: -24,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.16,
      shadowRadius: 8,

      elevation: 6,
    },
  });