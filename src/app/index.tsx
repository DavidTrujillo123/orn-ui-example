import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Title, Subtitle, Body, Caption } from 'orn-ui/title';
import { Card } from 'orn-ui/card';
import { Badge } from 'orn-ui/badge';
import { Input } from 'orn-ui/input';
import { Button } from 'orn-ui/button';
import { IconButton } from 'orn-ui/icon-button';
import { Spinner } from 'orn-ui/spinner';
import { Avatar } from 'orn-ui/avatar';
import { Image } from 'orn-ui/image';
import { KeyValueRow } from 'orn-ui/key-value-row';
import { Stepper } from 'orn-ui/stepper';
import { PressableScale } from 'orn-ui/pressable-scale';
import { Modal } from 'orn-ui/modal';
import { BottomSheet } from 'orn-ui/bottom-sheet';
import { EmptyState } from 'orn-ui/empty-state';
import { AvatarHeader } from 'orn-ui/avatar-header';
import { Fab } from 'orn-ui/fab';
import { useColors } from 'orn-ui/theme';
import { useToast } from 'orn-ui/use-toast';
import { useAlert } from 'orn-ui/use-alert';
import { Screen } from 'orn-ui/screen';

import { ApiProductRepository } from '@/infrastructure/repositories/ApiProductRepository';
import { ApiCategoryRepository } from '@/infrastructure/repositories/ApiCategoryRepository';
import { ProductUseCases } from '@/domain/usecases/products/ProductUseCases';
import { CategoryUseCases } from '@/domain/usecases/categories/CategoryUseCases';
import { Product } from '@/domain/entities/Product';
import { Category } from '@/domain/entities/Category';
import { useCart } from '@/presentation/state/CartContext';
import { useAuth } from '@/presentation/state/AuthContext';

const productUseCases = new ProductUseCases(new ApiProductRepository());
const categoryUseCases = new CategoryUseCases(new ApiCategoryRepository());

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { addToCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useAlert();
  const colors = useColors();
  const [detailQuantity, setDetailQuantity] = useState('1');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Create Product Form State & Inline Validation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCatId, setNewCatId] = useState('1');
  const [creating, setCreating] = useState(false);

  // Field Errors
  const [titleError, setTitleError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const loadInitialData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productUseCases.getProducts(30, 0),
        categoryUseCases.getCategories(),
      ]);
      setProducts(prods);
      setFilteredProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error loading products/categories:', err);
      toast.show({
        title: 'Error de conexión',
        message: 'No se pudieron cargar los productos.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount by design
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadInitialData is not memoized, only meant to run once
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(text, selectedCategoryId);
  };

  const handleCategorySelect = (catId: number | null) => {
    setSelectedCategoryId(catId);
    applyFilters(search, catId);
  };

  const applyFilters = (query: string, catId: number | null) => {
    let result = products;
    if (catId !== null) {
      result = result.filter((p) => p.category?.id === catId);
    }
    if (query.trim()) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredProducts(result);
  };

  const resetFormState = () => {
    setNewTitle('');
    setNewPrice('');
    setNewDescription('');
    setNewCatId('1');
    setTitleError('');
    setPriceError('');
    setDescriptionError('');
  };

  const handleCreateProduct = async () => {
    let hasError = false;

    if (!newTitle.trim()) {
      setTitleError('El nombre del producto es obligatorio.');
      hasError = true;
    } else {
      setTitleError('');
    }

    if (!newPrice.trim() || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
      setPriceError('Ingresa un precio válido mayor a 0.');
      hasError = true;
    } else {
      setPriceError('');
    }

    if (!newDescription.trim()) {
      setDescriptionError('La descripción es obligatoria.');
      hasError = true;
    } else {
      setDescriptionError('');
    }

    if (hasError) return;

    setCreating(true);
    try {
      const created = await productUseCases.createProduct({
        title: newTitle.trim(),
        price: parseFloat(newPrice),
        description: newDescription.trim(),
        categoryId: parseInt(newCatId, 10) || 1,
        images: ['https://i.imgur.com/QkIa5tT.jpeg'],
      });

      setProducts((prev) => [created, ...prev]);
      setFilteredProducts((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      resetFormState();

      toast.show({
        title: '¡Producto Publicado!',
        message: `${created.title} ha sido agregado al catálogo.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast.show({
        title: 'Error al crear',
        message: err.message,
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const isOk = await confirm({
      title: 'Eliminar producto',
      message: '¿Estás seguro de eliminar este producto del catálogo?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });

    if (!isOk) return;

    try {
      await productUseCases.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setFilteredProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedProduct(null);
      toast.show({
        title: 'Producto eliminado',
        message: 'El producto fue removido correctamente.',
        variant: 'info',
      });
    } catch (err: any) {
      toast.show({
        title: 'Error al eliminar',
        message: err.message,
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Screen scrollable={false} edges={['top']} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="large" variant="ring" />
        <View style={{ height: 16 }} />
        <Body>Cargando tienda...</Body>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} edges={['top']} style={{ paddingHorizontal: 16 }}>
      {/* App Top Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Title style={{ fontSize: 24, fontWeight: '800' }}>Platzi Store</Title>
          <Caption>Encuentra los mejores productos</Caption>
        </View>

        <Avatar size={44}>
          <Title color={colors.primary} style={{ fontSize: 16, fontWeight: 'bold' }}>
            {user ? user.name.charAt(0).toUpperCase() : 'P'}
          </Title>
        </Avatar>
      </View>

      {/* Search Bar */}
      <View style={{ marginBottom: 16 }}>
        <Input
          placeholder="Buscar artículos..."
          value={search}
          onChangeText={handleSearch}
          leftIconName="search"
          rightIconName={search ? 'close' : undefined}
          onRightIconPress={() => handleSearch('')}
        />
      </View>

      {/* Category Filter Pills (Horizontal Scroll) */}
      <View style={{ marginBottom: 16 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {[{ id: null, name: 'Todos' }, ...categories.map((c) => ({ id: c.id, name: c.name }))].map((item) => {
            const isSelected = selectedCategoryId === item.id;
            return (
              <TouchableOpacity
                key={item.id === null ? 'all' : item.id.toString()}
                activeOpacity={0.7}
                onPress={() => handleCategorySelect(item.id)}
              >
                <Badge
                  label={item.name}
                  variant={isSelected ? 'info' : 'neutral'}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos productos coincidentes con tu búsqueda o categoría seleccionada."
        />
      ) : (
        <FlatList
          key="products-grid-2"
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} />}
          renderItem={({ item }) => (
            <PressableScale
              onPress={() => {
                setDetailQuantity('1');
                setSelectedProduct(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Ver detalles de ${item.title}`}
              style={{ flex: 1 }}
            >
              <Card style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
                <View>
                  <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                  <View style={{ position: 'absolute', right: 8, bottom: 8 }}>
                    <IconButton
                      iconName="plus"
                      accessibilityLabel={`Agregar ${item.title} al carrito`}
                      color="#ffffff"
                      style={{ backgroundColor: colors.primary, borderRadius: 999 }}
                      onPress={() => {
                        addToCart(item);
                        toast.show({
                          title: 'Agregado al Carrito',
                          message: `${item.title} fue añadido.`,
                          variant: 'success',
                        });
                      }}
                    />
                  </View>
                </View>

                <View style={{ padding: 10, gap: 2 }}>
                  <Caption numberOfLines={1}>{item.category?.name || 'Producto'}</Caption>
                  <Subtitle numberOfLines={2} style={{ fontSize: 13, fontWeight: '600', minHeight: 34 }}>
                    {item.title}
                  </Subtitle>
                  <Title color={colors.primary} style={{ fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                    ${item.price}
                  </Title>
                </View>
              </Card>
            </PressableScale>
          )}
        />
      )}

      {/* Floating Action Button (FAB) for Creating Products */}
      <Fab
        iconName="plus"
        size={56}
        bottom={insets.bottom + 20}
        right={20}
        accessibilityLabel="Publicar Nuevo Producto"
        onPress={() => {
          resetFormState();
          setIsCreateModalOpen(true);
        }}
      />

      {/* Product Detail BottomSheet */}
      {selectedProduct && (
        <BottomSheet
          visible={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        >
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
            <AvatarHeader
              iconName="info"
              title={selectedProduct.title}
              subtitle={`$${selectedProduct.price} — ${selectedProduct.category?.name || 'General'}`}
            />

            <Image
              source={{ uri: selectedProduct.images[0] }}
              height={200}
              radius={16}
              resizeMode="cover"
            />

            <Body style={{ lineHeight: 22 }}>{selectedProduct.description}</Body>

            <Card style={{ padding: 12, gap: 8 }}>
              <KeyValueRow label="Código de Producto" value={`#${selectedProduct.id}`} />
              <KeyValueRow label="Categoría" value={selectedProduct.category?.name || 'General'} />
              <KeyValueRow label="Garantía de Devolución" value="30 días gratis" />
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Subtitle style={{ fontWeight: '700' }}>Cantidad</Subtitle>
              <View style={{ width: 130 }}>
                <Stepper
                  value={detailQuantity}
                  min={1}
                  max={99}
                  onChangeText={setDetailQuantity}
                  onIncrement={() => setDetailQuantity((q) => String(Math.min(99, parseInt(q, 10) + 1)))}
                  onDecrement={() => setDetailQuantity((q) => String(Math.max(1, parseInt(q, 10) - 1)))}
                  size="sm"
                />
              </View>
            </View>

            <View style={{ gap: 10, marginTop: 4 }}>
              <Button
                title="Comprar Ahora"
                variant="primary"
                onPress={() => {
                  const qty = Math.max(1, parseInt(detailQuantity, 10) || 1);
                  addToCart(selectedProduct);
                  if (qty > 1) updateQuantity(selectedProduct.id, qty);
                  setSelectedProduct(null);
                  router.push('/cart');
                }}
              />
              <Button
                title="Añadir al Carrito"
                variant="outline"
                onPress={() => {
                  const qty = Math.max(1, parseInt(detailQuantity, 10) || 1);
                  addToCart(selectedProduct);
                  if (qty > 1) updateQuantity(selectedProduct.id, qty);
                  setSelectedProduct(null);
                  toast.show({
                    title: '¡Agregado!',
                    message: `${selectedProduct.title} guardado en el carrito.`,
                    variant: 'success',
                  });
                }}
              />
              <Button
                title="Eliminar Producto"
                variant="destructive"
                onPress={() => handleDeleteProduct(selectedProduct.id)}
              />
            </View>
          </ScrollView>
        </BottomSheet>
      )}

      {/* Overlay Modal Create Product */}
      <Modal
        variant="overlay"
        title="Publicar Nuevo Producto"
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <View style={{ gap: 12 }}>
          <Input
            label="Nombre del Producto"
            required
            placeholder="Ej. Tenis Deportivos"
            value={newTitle}
            error={titleError}
            onChangeText={(val) => {
              setNewTitle(val);
              if (val.trim()) setTitleError('');
            }}
          />
          <Input
            label="Precio ($ USD)"
            required
            placeholder="Ej. 49.99"
            keyboardType="numeric"
            value={newPrice}
            error={priceError}
            onChangeText={(val) => {
              setNewPrice(val);
              if (val.trim()) setPriceError('');
            }}
          />
          <Input
            label="Descripción"
            required
            placeholder="Describe las características principales..."
            value={newDescription}
            error={descriptionError}
            onChangeText={(val) => {
              setNewDescription(val);
              if (val.trim()) setDescriptionError('');
            }}
          />
          <Input
            label="ID de Categoría"
            placeholder="1 (Ropa), 2 (Electrónica)..."
            keyboardType="numeric"
            value={newCatId}
            onChangeText={setNewCatId}
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button
              title="Cancelar"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setIsCreateModalOpen(false)}
            />
            <Button
              title={creating ? 'Guardando...' : 'Publicar'}
              variant="primary"
              style={{ flex: 1 }}
              disabled={creating}
              onPress={handleCreateProduct}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
