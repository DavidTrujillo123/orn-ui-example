import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title, Subtitle, Body, Caption } from 'orn-ui/title';
import { Gradient } from 'orn-ui/gradient';
import { Slides } from 'orn-ui/slides';
import { SymmetricGrid } from 'orn-ui/symmetric-grid';
import { useColors } from 'orn-ui/theme';
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
  const colors = useColors();

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount by design
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchCategories is not memoized, only meant to run once
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
      <Screen scrollable={false} edges={['top']} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="large" variant="dots" />
        <View style={{ height: 16 }} />
        <Body>Cargando categorías...</Body>
      </Screen>
    );
  }

  const featured = categories.slice(0, 4);
  const slideBackgrounds = [
    [colors.primary, colors.secondary],
    [colors.success, colors.primary],
    [colors.warning, colors.error],
    [colors.secondary, colors.success],
  ];

  return (
    <Screen scrollable={false} edges={['top']} style={{ paddingHorizontal: 16 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCategories} />}
      >
        <Gradient
          colors={[colors.primarySoft, colors.background]}
          direction="diagonal"
          style={{ borderRadius: 16, padding: 16 }}
        >
          <Title style={{ fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
            Explora Categorías
          </Title>
          <Caption>Encuentra productos organizados por categoría</Caption>
        </Gradient>

        {featured.length > 0 && (
          <Slides
            data={featured}
            keyExtractor={(item) => item.id.toString()}
            background={(_, index) => slideBackgrounds[index % slideBackgrounds.length]}
            gradientDirection="diagonal"
            height={160}
            loop
            autoPlay
            interval={4000}
            indicators="dots"
            slideStyle={{ borderRadius: 16, overflow: 'hidden' }}
            renderItem={(item) => (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 }}>
                <View style={{ flex: 1, gap: 8 }}>
                  <Caption color={colors.white}>Destacado</Caption>
                  <Title color={colors.white} numberOfLines={1} style={{ fontSize: 22, fontWeight: '800' }}>
                    {item.name}
                  </Title>
                  <Button
                    title="Ver productos"
                    variant="secondary"
                    size="sm"
                    style={{ alignSelf: 'flex-start' }}
                    onPress={() => handleCategoryPress(item)}
                  />
                </View>
                <Image source={{ uri: item.image }} width={96} height={96} radius={48} resizeMode="cover" />
              </View>
            )}
          />
        )}

        <Subtitle style={{ fontSize: 16, fontWeight: '700' }}>Todas las categorías</Subtitle>

        <SymmetricGrid
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          columns={2}
          gap={16}
          renderItem={(item) => (
            <Card style={{ flex: 1, padding: 16, alignItems: 'center', gap: 12 }}>
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
      </ScrollView>

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
                    <Title color={colors.primaryText} style={{ fontSize: 15, fontWeight: 'bold' }}>
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

