import React from 'react';
import { Tabs } from 'expo-router';
import { NavigationBar, type NavigationBarItem } from 'orn-ui/navigation-bar';
import { useCart } from '@/presentation/state/CartContext';

const NAV_ITEMS: NavigationBarItem[] = [
  { key: 'index', label: 'Productos', iconName: 'check' },
  { key: 'explore', label: 'Categorías', iconName: 'search' },
  { key: 'users', label: 'Usuarios', iconName: 'info' },
  { key: 'cart', label: 'Carrito', iconName: 'check' },
  { key: 'profile', label: 'Perfil', iconName: 'info' },
];

export default function AppTabs() {
  const { totalItems } = useCart();

  const items = NAV_ITEMS.map((item) => {
    if (item.key === 'cart' && totalItems > 0) {
      return { ...item, badge: totalItems };
    }
    return item;
  });

  return (
    <Tabs
      tabBar={(props) => {
        const { state, navigation } = props;
        const currentRoute = state.routes[state.index].name;

        return (
          <NavigationBar
            items={items}
            activeKey={currentRoute}
            onChange={(key) => navigation.navigate(key)}
          />
        );
      }}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Productos' }} />
      <Tabs.Screen name="explore" options={{ title: 'Categorías' }} />
      <Tabs.Screen name="users" options={{ title: 'Usuarios' }} />
      <Tabs.Screen name="cart" options={{ title: 'Carrito' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

