import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title, Subtitle, Caption } from 'orn-ui/title';
import { Chart } from 'orn-ui/chart';
import { FormActions } from 'orn-ui/form-actions';
import { useColors } from 'orn-ui/theme';
import { Card } from 'orn-ui/card';
import { Badge } from 'orn-ui/badge';
import { Input } from 'orn-ui/input';
import { Button } from 'orn-ui/button';
import { Avatar } from 'orn-ui/avatar';
import { Modal } from 'orn-ui/modal';
import { AvatarHeader } from 'orn-ui/avatar-header';
import { SearchList } from 'orn-ui/search-list';
import { Screen } from 'orn-ui/screen';
import { useToast } from 'orn-ui/use-toast';

import { ApiUserRepository } from '@/infrastructure/repositories/ApiUserRepository';
import { UserUseCases } from '@/domain/usecases/users/UserUseCases';
import { User } from '@/domain/entities/User';

const userUseCases = new UserUseCases(new ApiUserRepository());

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const colors = useColors();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Register User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await userUseCases.getUsers(20);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.show({
        title: 'Error de conexión',
        message: 'No se pudo obtener la lista de usuarios.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount by design
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUsers is not memoized, only meant to run once
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.trim()) {
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(text.toLowerCase()) ||
            u.email.toLowerCase().includes(text.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  };

  const roleData = [
    { x: 'Clientes', usuarios: users.filter((u) => u.role !== 'admin').length },
    { x: 'Administradores', usuarios: users.filter((u) => u.role === 'admin').length },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

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
      setFilteredUsers((prev) => [newUser, ...prev]);
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setAvatar('');
      toast.show({
        title: '¡Usuario Registrado!',
        message: `${newUser.name} se unió a la plataforma.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast.show({
        title: 'Error de registro',
        message: err.message,
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen scrollable={false} edges={['top']} style={{ paddingHorizontal: 16 }}>
      <SearchList
        header={
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Title style={{ fontSize: 24, fontWeight: '800' }}>Directorio de Usuarios</Title>
              <Caption>Comunidad activa en la plataforma</Caption>
            </View>

            <Button
              title="+ Registrar"
              variant="primary"
              size="sm"
              onPress={() => setIsModalOpen(true)}
            />
          </View>
        }
        ListHeaderComponent={
          users.length > 0 ? (
            <Card style={{ padding: 16, gap: 8 }}>
              <Subtitle style={{ fontSize: 15, fontWeight: '700' }}>Usuarios por rol</Subtitle>
              <Chart
                type="donut"
                data={roleData}
                series={[{ key: 'usuarios', label: 'Usuarios' }]}
                height={180}
                sliceLabels="value"
                legend="static"
                accessibilityLabel="Distribución de usuarios por rol"
              />
            </Card>
          ) : null
        }
        searchValue={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Buscar por nombre o correo..."
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        isLoading={loading}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        emptyTitle="Sin usuarios"
        emptyDescription="No se encontraron usuarios que coincidan con la búsqueda."
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 14 }}
        renderItem={({ item }) => (
          <Card style={{ padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar size={52}>
              <Title color={colors.primaryText} style={{ fontSize: 20, fontWeight: 'bold' }}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
              </Title>
            </Avatar>

            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Subtitle style={{ fontSize: 16, fontWeight: '700' }}>{item.name}</Subtitle>
                <Badge
                  label={item.role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE'}
                  variant={item.role === 'admin' ? 'error' : 'info'}
                />
              </View>
              <Caption>{item.email}</Caption>
              <Caption color={colors.textLight}>Miembro ID #{item.id}</Caption>
            </View>
          </Card>
        )}
      />

      {/* Overlay Modal Register User */}
      <Modal
        variant="overlay"
        title="Registrar Nuevo Usuario"
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <View style={{ gap: 12 }}>
          <AvatarHeader
            initials="NU"
            title="Nuevo Miembro"
            subtitle="Crea una cuenta en la plataforma"
          />

          <Input
            label="Nombre Completo *"
            placeholder="Ej. Maria Lopez"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Correo Electrónico *"
            placeholder="ejemplo@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Contraseña *"
            placeholder="******"
            isPassword
            value={password}
            onChangeText={setPassword}
          />
          <Input
            label="Foto de Perfil (URL)"
            placeholder="https://..."
            value={avatar}
            onChangeText={setAvatar}
          />

          <FormActions
            primaryLabel="Registrar"
            primaryLoading={creating}
            onPrimaryPress={handleRegisterUser}
            secondaryLabel="Cancelar"
            onSecondaryPress={() => setIsModalOpen(false)}
            style={{ marginTop: 8 }}
          />
        </View>
      </Modal>
    </Screen>
  );
}

