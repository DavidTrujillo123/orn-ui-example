import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title, Subtitle, Body, Caption } from 'orn-ui/title';
import { Card } from 'orn-ui/card';
import { Badge } from 'orn-ui/badge';
import { Input } from 'orn-ui/input';
import { Button } from 'orn-ui/button';
import { Spinner } from 'orn-ui/spinner';
import { Avatar } from 'orn-ui/avatar';
import { Modal } from 'orn-ui/modal';
import { AvatarHeader } from 'orn-ui/avatar-header';
import { useToast } from 'orn-ui/use-toast';

import { ApiUserRepository } from '@/infrastructure/repositories/ApiUserRepository';
import { UserUseCases } from '@/domain/usecases/users/UserUseCases';
import { User } from '@/domain/entities/User';

const userUseCases = new UserUseCases(new ApiUserRepository());

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Register User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await userUseCases.getUsers(20);
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.show({
        title: 'Error de Red',
        message: 'Fallo al obtener la lista de usuarios.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegisterUser = async () => {
    if (!name || !email || !password) {
      toast.show({
        title: 'Campos requeridos',
        message: 'Por favor ingresa nombre, email y contraseña.',
        variant: 'warning',
      });
      return;
    }
    setCreating(true);
    try {
      const newUser = await userUseCases.createUser({
        name,
        email,
        password,
        avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser',
        role: 'customer',
      });
      setUsers((prev) => [newUser, ...prev]);
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      toast.show({
        title: '¡Usuario Registrado!',
        message: `${newUser.name} se creó exitosamente.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast.show({
        title: 'Error al registrar',
        message: err.message,
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Spinner size="large" variant="dots" />
        <View style={{ height: 16 }} />
        <Body>Cargando Usuarios de Platzi API...</Body>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Title style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>Usuarios Platzi</Title>
          <Caption color="#64748B">Gestión de usuarios vía Clean Arch</Caption>
        </View>

        <Button
          title="+ Nuevo"
          variant="primary"
          size="sm"
          onPress={() => setIsModalOpen(true)}
        />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />}
        renderItem={({ item }) => (
          <Card style={{ padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar size={48}>
              <Title color="#2563EB" style={{ fontSize: 18, fontWeight: 'bold' }}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
              </Title>
            </Avatar>

            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Subtitle style={{ fontSize: 16, fontWeight: '700' }}>{item.name}</Subtitle>
                <Badge
                  label={item.role || 'customer'}
                  variant={item.role === 'admin' ? 'error' : 'neutral'}
                />
              </View>
              <Caption color="#64748B">{item.email}</Caption>
              <Caption color="#94A3B8">ID: #{item.id}</Caption>
            </View>
          </Card>
        )}
      />

      {/* Overlay Modal Register User */}
      <Modal
        variant="overlay"
        title="Registrar Usuario"
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <View style={{ gap: 12 }}>
          <AvatarHeader
            initials="NU"
            title="Registrar Usuario"
            subtitle="Platzi API Clean Architecture"
          />

          <Input
            label="Nombre Completo"
            placeholder="Ej. Maria Lopez"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Email"
            placeholder="ejemplo@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Contraseña"
            placeholder="******"
            isPassword
            value={password}
            onChangeText={setPassword}
          />
          <Input
            label="Avatar URL"
            placeholder="https://..."
            value={avatar}
            onChangeText={setAvatar}
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button
              title="Cancelar"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setIsModalOpen(false)}
            />
            <Button
              title={creating ? 'Registrando...' : 'Registrar'}
              variant="primary"
              style={{ flex: 1 }}
              disabled={creating}
              onPress={handleRegisterUser}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
