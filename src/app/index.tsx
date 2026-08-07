import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title, Subtitle, Body, Caption } from 'orn-ui/title';
import { Card } from 'orn-ui/card';
import { Badge } from 'orn-ui/badge';
import { Input } from 'orn-ui/input';
import { Button } from 'orn-ui/button';
import { Spinner } from 'orn-ui/spinner';
import { Avatar } from 'orn-ui/avatar';
import { Image } from 'orn-ui/image';
import { KeyValueRow } from 'orn-ui/key-value-row';
import { Modal } from 'orn-ui/modal';
import { BottomSheet } from 'orn-ui/bottom-sheet';
import { EmptyState } from 'orn-ui/empty-state';
import { AvatarHeader } from 'orn-ui/avatar-header';
import { useToast } from 'orn-ui/use-toast';
import { useAlert } from 'orn-ui/use-alert';

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
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useAlert();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Create Product Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCatId, setNewCatId] = useState('1');
  const [creating, setCreating] = useState(false);

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
        title: 'Error de carga',
        message: 'No se pudieron cargar los datos de Platzi API.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
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

  const handleCreateProduct = async () => {
    if (!newTitle || !newPrice || !newDescription) {
      toast.show({
        title: 'Campos requeridos',
        message: 'Ingresa título, precio y descripción.',
        variant: 'warning',
      });
      return;
    }
    setCreating(true);
    try {
      const created = await productUseCases.createProduct({
        title: newTitle,
        price: parseFloat(newPrice) || 10,
        description: newDescription,
        categoryId: parseInt(newCatId, 10) || 1,
        images: ['https://i.imgur.com/QkIa5tT.jpeg'],
      });
      setProducts((prev) => [created, ...prev]);
      setFilteredProducts((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewPrice('');
      setNewDescription('');
      toast.show({
        title: '¡Producto Creado!',
        message: `${created.title} ha sido registrado en Platzi API.`,
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
      message: '¿Estás seguro de eliminar este producto de la API?',
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
        message: 'El producto fue removido exitosamente.',
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Spinner size="large" variant="ring" />
        <View style={{ height: 16 }} />
        <Body>Cargando Platzi Store Clean Arch...</Body>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Title style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>Platzi Clean Store</Title>
          <Caption color="#64748B">Powered strictly by orn-ui</Caption>
        </View>

        <Avatar size={44}>
          <Title color="#2563EB" style={{ fontSize: 16, fontWeight: 'bold' }}>
            {user ? user.name.charAt(0).toUpperCase() : 'P'}
          </Title>
        </Avatar>
      </View>

      {/* Search Input & Add Product Button */}
      <View style={{ gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="Buscar productos Platzi..."
          value={search}
          onChangeText={handleSearch}
          leftIconName="search"
          rightIconName={search ? 'close' : undefined}
          onRightIconPress={() => handleSearch('')}
        />

        <Button
          title="+ Crear Nuevo Producto"
          variant="secondary"
          size="sm"
          onPress={() => setIsCreateModalOpen(true)}
        />
      </View>

      {/* Categories Horizontal Filter Badges */}
      <View style={{ marginBottom: 16 }}>
        <FlatList
          horizontal
          data={[{ id: null, name: 'Todos' }, ...categories.map((c) => ({ id: c.id, name: c.name }))]}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => (item.id === null ? 'all' : item.id.toString())}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategoryId === item.id;
            return (
              <Badge
                label={item.name}
                variant={isSelected ? 'info' : 'neutral'}
                backgroundColor={isSelected ? '#2563EB' : undefined}
                textColor={isSelected ? '#FFFFFF' : undefined}
                style={{ paddingHorizontal: 14, paddingVertical: 8 }}
              />
            );
          }}
        />
      </View>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No se encontraron productos para los filtros seleccionados."
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} />}
          renderItem={({ item }) => (
            <Card style={{ padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Image
                source={{ uri: item.images[0] }}
                width={80}
                height={80}
                radius={12}
                resizeMode="cover"
              />

              <View style={{ flex: 1, gap: 4 }}>
                <Badge label={item.category?.name || 'Item'} variant="neutral" />
                <Subtitle numberOfLines={1} style={{ fontSize: 16, fontWeight: '700' }}>
                  {item.title}
                </Subtitle>
                <Title color="#2563EB" style={{ fontSize: 16, fontWeight: 'bold' }}>
                  ${item.price}
                </Title>
              </View>

              <View style={{ gap: 6 }}>
                <Button
                  title="Ver"
                  variant="outline"
                  size="sm"
                  onPress={() => setSelectedProduct(item)}
                />
                <Button
                  title="+ Carrito"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    addToCart(item);
                    toast.show({
                      title: 'Añadido al Carrito',
                      message: `${item.title} fue agregado.`,
                      variant: 'success',
                    });
                  }}
                />
              </View>
            </Card>
          )}
        />
      )}

      {/* BottomSheet Product Detail View */}
      {selectedProduct && (
        <BottomSheet
          visible={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        >
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
            <AvatarHeader
              iconName="info"
              title={selectedProduct.title}
              subtitle={`$${selectedProduct.price} — Categoría: ${selectedProduct.category?.name || 'General'}`}
            />

            <Image
              source={{ uri: selectedProduct.images[0] }}
              height={200}
              radius={16}
              resizeMode="cover"
            />

            <Body style={{ lineHeight: 22, color: '#475569' }}>{selectedProduct.description}</Body>

            <Card style={{ backgroundColor: '#F1F5F9', padding: 12, gap: 8 }}>
              <KeyValueRow label="ID de Producto" value={`#${selectedProduct.id}`} />
              <KeyValueRow label="Categoría" value={selectedProduct.category?.name || 'N/A'} />
              <KeyValueRow label="Garantía Platzi" value="100% Verificado" />
            </Card>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button
                title="Añadir al Carrito"
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                  toast.show({
                    title: '¡Añadido!',
                    message: `${selectedProduct.title} guardado en el carrito.`,
                    variant: 'success',
                  });
                }}
              />
              <Button
                title="Eliminar"
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
        title="Crear Producto (Platzi API)"
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <View style={{ gap: 12 }}>
          <Input
            label="Título"
            placeholder="Ej. T-Shirt Premium"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <Input
            label="Precio ($)"
            placeholder="Ej. 29.99"
            keyboardType="numeric"
            value={newPrice}
            onChangeText={setNewPrice}
          />
          <Input
            label="Descripción"
            placeholder="Descripción detallada..."
            value={newDescription}
            onChangeText={setNewDescription}
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
              title={creating ? 'Guardando...' : 'Crear'}
              variant="primary"
              style={{ flex: 1 }}
              disabled={creating}
              onPress={handleCreateProduct}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
