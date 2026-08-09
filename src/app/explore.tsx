import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title, Subtitle, Body, Caption } from 'orn-ui/title';
import { Card } from 'orn-ui/card';
import { Button } from 'orn-ui/button';
import { Spinner } from 'orn-ui/spinner';
import { Image } from 'orn-ui/image';
import { BottomSheet } from 'orn-ui/bottom-sheet';
import { AvatarHeader } from 'orn-ui/avatar-header';
import { List } from 'orn-ui/list';
import { Screen } from 'orn-ui/screen';
import { useToast } from 'orn-ui/use-toast';

import { ApiCategoryRepository } from '@/infrastructure/repositories/ApiCategoryRepository';
import { CategoryUseCases } from '@/domain/usecases/categories/CategoryUseCases';
import { Category } from '@/domain/entities/Category';
import { Product } from '@/domain/entities/Product';
import { useCart } from '@/presentation/state/CartContext';

const categoryUseCases = new CategoryUseCases(new ApiCategoryRepository());

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await categoryUseCases.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.show({
        title: 'Error de conexión',
        message: 'No se pudieron obtener las categorías.',
        variant: 'error',
      });
    } finally {
      setLoadingCategories(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryPress = async (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryProducts([]);
    setLoadingProducts(true);
    try {
      const prods = await categoryUseCases.getCategoryProducts(cat.id);
      setCategoryProducts(prods);
    } catch (err) {
      console.error('Error fetching category products:', err);
      toast.show({
        title: 'Error de carga',
        message: `No se pudieron cargar los productos de ${cat.name}.`,
        variant: 'error',
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  if (loadingCategories) {
    return (
      <Screen scrollable={false} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="large" variant="dots" />
        <View style={{ height: 16 }} />
        <Body>Cargando categorías...</Body>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} style={{ paddingHorizontal: 16 }}>
      <Title style={{ fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
        Explora Categorías
      </Title>
      <Caption style={{ marginBottom: 16 }}>
        Encuentra productos organizados por categoría
      </Caption>

      <FlatList
        key="categories-grid-2"
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCategories} />}
        renderItem={({ item }) => (
          <Card
            style={{
              flex: 1,
              padding: 16,
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Image
              source={{ uri: item.image }}
              width={100}
              height={100}
              radius={16}
              resizeMode="cover"
            />
            <Title align="center" numberOfLines={1} style={{ fontSize: 16, fontWeight: '700' }}>
              {item.name}
            </Title>
            <Button
              title="Ver Productos"
              variant="outline"
              size="sm"
              onPress={() => handleCategoryPress(item)}
            />
          </Card>
        )}
      />

      {/* BottomSheet for Selected Category Products */}
      {selectedCategory && (
        <BottomSheet
          visible={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          scrollable={false}
        >
          <View style={{ height: 420, paddingBottom: 10 }}>
            <AvatarHeader
              iconName="info"
              title={selectedCategory.name}
              subtitle="Catálogo de productos disponibles"
            />

            <List
              containerStyle={{ flex: 1 }}
              data={categoryProducts}
              keyExtractor={(item) => item.id.toString()}
              isLoading={loadingProducts}
              emptyTitle="Sin productos"
              emptyDescription={`No hay productos disponibles en la categoría ${selectedCategory.name}.`}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <Card style={{ padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.images[0] }}
                    width={60}
                    height={60}
                    radius={10}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Subtitle numberOfLines={1} style={{ fontSize: 15, fontWeight: '700' }}>
                      {item.title}
                    </Subtitle>
                    <Title color="#2563EB" style={{ fontSize: 15, fontWeight: 'bold' }}>
                      ${item.price}
                    </Title>
                  </View>
                  <Button
                    title="+ Carrito"
                    variant="primary"
                    size="sm"
                    onPress={() => {
                      addToCart(item);
                      toast.show({
                        title: '¡Producto añadido!',
                        message: `${item.title} fue agregado al carrito.`,
                        variant: 'success',
                      });
                    }}
                  />
                </Card>
              )}
            />
          </View>
        </BottomSheet>
      )}
    </Screen>
  );
}

