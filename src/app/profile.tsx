import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title, Subtitle, Body, Caption } from 'orn-ui/title';
import { Card } from 'orn-ui/card';
import { Badge } from 'orn-ui/badge';
import { Input } from 'orn-ui/input';
import { Button } from 'orn-ui/button';
import { AvatarHeader } from 'orn-ui/avatar-header';
import { InfoRow } from 'orn-ui/info-row';
import { OptionCard } from 'orn-ui/option-card';
import { Checkbox } from 'orn-ui/checkbox';
import { Select } from 'orn-ui/select';
import { Divider } from 'orn-ui/divider';
import { Modal } from 'orn-ui/modal';
import { useToast } from 'orn-ui/use-toast';
import { useAlert } from 'orn-ui/use-alert';

import { useAuth } from '@/presentation/state/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, isLoading, error, login, logout } = useAuth();
  const toast = useToast();
  const { confirm } = useAlert();

  const [email, setEmail] = useState('john@mail.com');
  const [password, setPassword] = useState('changeme');
  const [activeTab, setActiveTab] = useState<'info' | 'cards' | 'settings' | 'support'>('info');

  // Preferences & Security State
  const [currency, setCurrency] = useState('USD');
  const [enable2FA, setEnable2FA] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [promoEmails, setPromoEmails] = useState(false);

  // Add Card Modal State
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');

  const currencyOptions = [
    { label: 'Dólar Estadounidense (USD)', value: 'USD' },
    { label: 'Peso Mexicano (MXN)', value: 'MXN' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'Peso Colombiano (COP)', value: 'COP' },
  ];

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      toast.show({
        title: '¡Bienvenido!',
        message: 'Sesión autenticada en Platzi API.',
        variant: 'success',
      });
    } else {
      toast.show({
        title: 'Error de Autenticación',
        message: 'Verifica tus credenciales.',
        variant: 'error',
      });
    }
  };

  const handleLogout = async () => {
    const isOk = await confirm({
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de salir de tu cuenta?',
      confirmText: 'Cerrar Sesión',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (isOk) {
      logout();
      toast.show({
        title: 'Sesión Cerrada',
        message: 'Has salido de tu cuenta.',
        variant: 'info',
      });
    }
  };

  const handleSaveNewCard = () => {
    if (!newCardNumber || !newCardHolder) {
      toast.show({
        title: 'Campos vacíos',
        message: 'Ingresa los datos de la tarjeta.',
        variant: 'warning',
      });
      return;
    }
    setIsAddCardOpen(false);
    setNewCardNumber('');
    setNewCardHolder('');
    setNewCardExpiry('');
    toast.show({
      title: 'Tarjeta Registrada',
      message: 'Tu nueva tarjeta bancaria fue vinculada exitosamente.',
      variant: 'success',
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
        gap: 20,
      }}
    >
      <Title style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>
        Mi Cuenta Platzi
      </Title>

      {user ? (
        // Authenticated Profile Dashboard
        <View style={{ gap: 16 }}>
          {/* Main User Card Header */}
          <Card style={{ padding: 20, gap: 12, backgroundColor: '#FFFFFF' }}>
            <AvatarHeader
              initials={user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
              title={user.name}
              subtitle={user.email}
            />

            <View style={{ alignItems: 'center' }}>
              <Badge label={user.role ? user.role.toUpperCase() : 'CUSTOMER'} variant="info" />
            </View>
          </Card>

          {/* Quick Navigation Option Cards */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <OptionCard
              label="Info"
              iconName="info"
              isSelected={activeTab === 'info'}
              onPress={() => setActiveTab('info')}
            />
            <OptionCard
              label="Tarjetas"
              iconName="check"
              isSelected={activeTab === 'cards'}
              onPress={() => setActiveTab('cards')}
            />
            <OptionCard
              label="Ajustes"
              iconName="warning"
              isSelected={activeTab === 'settings'}
              onPress={() => setActiveTab('settings')}
            />
            <OptionCard
              label="Soporte"
              iconName="question"
              isSelected={activeTab === 'support'}
              onPress={() => setActiveTab('support')}
            />
          </View>

          {/* Tab 1: Account Info */}
          {activeTab === 'info' && (
            <Card style={{ padding: 16, gap: 14, backgroundColor: '#FFFFFF' }}>
              <Title style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                Información de la Cuenta (`InfoRow`):
              </Title>
              <InfoRow
                icon="info"
                label="ID de Usuario Platzi"
                value={`#${user.id}`}
                placeholder="N/A"
              />
              <InfoRow
                icon="check"
                label="Rol de Permisos"
                value={user.role || 'Customer'}
                placeholder="Customer"
              />
              <InfoRow
                icon="warning"
                label="Estado de Token JWT"
                value={token ? 'Bearer Token Activo' : 'Sin Token'}
                placeholder="Inactivo"
              />

              <Divider />

              <Select
                label="Moneda Preferida"
                options={currencyOptions}
                selectedValue={currency}
                onSelect={setCurrency}
              />
            </Card>
          )}

          {/* Tab 2: Saved Bank Cards */}
          {activeTab === 'cards' && (
            <View style={{ gap: 14 }}>
              <Card style={{ padding: 16, gap: 12, backgroundColor: '#FFFFFF' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title style={{ fontSize: 16, fontWeight: '700' }}>Tarjetas Vinculadas</Title>
                  <Button
                    title="+ Agregar"
                    variant="outline"
                    size="sm"
                    onPress={() => setIsAddCardOpen(true)}
                  />
                </View>

                {/* Card 1 */}
                <Card
                  style={{
                    backgroundColor: '#0F172A',
                    padding: 16,
                    borderRadius: 16,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title color="#FFFFFF" style={{ fontSize: 14, fontWeight: 'bold' }}>
                      Platzi Black Card
                    </Title>
                    <Badge label="VISA" variant="info" backgroundColor="#2563EB" textColor="#FFFFFF" />
                  </View>
                  <Title color="#FFFFFF" style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 2 }}>
                    4532 •••• •••• 4242
                  </Title>
                  <Caption color="#94A3B8">Vence: 12/28 — {user.name}</Caption>
                </Card>

                {/* Card 2 */}
                <Card
                  style={{
                    backgroundColor: '#1E1B4B',
                    padding: 16,
                    borderRadius: 16,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title color="#FFFFFF" style={{ fontSize: 14, fontWeight: 'bold' }}>
                      Mastercard Gold
                    </Title>
                    <Badge label="MC" variant="warning" backgroundColor="#F59E0B" textColor="#FFFFFF" />
                  </View>
                  <Title color="#FFFFFF" style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 2 }}>
                    5500 •••• •••• 8888
                  </Title>
                  <Caption color="#94A3B8">Vence: 09/27 — {user.name}</Caption>
                </Card>
              </Card>
            </View>
          )}

          {/* Tab 3: Security & Preferences */}
          {activeTab === 'settings' && (
            <Card style={{ padding: 16, gap: 14, backgroundColor: '#FFFFFF' }}>
              <Title style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                Seguridad y Notificaciones (`Checkbox`):
              </Title>
              <Checkbox
                label="Autenticación de 2 Factores (2FA)"
                value={enable2FA}
                onValueChange={setEnable2FA}
              />
              <Checkbox
                label="Notificaciones Push de estado de envíos"
                value={pushNotifs}
                onValueChange={setPushNotifs}
              />
              <Checkbox
                label="Alertas de inicio de sesión sospechoso"
                value={loginAlerts}
                onValueChange={setLoginAlerts}
              />
              <Checkbox
                label="Recibir ofertas y promociones exclusivas Platzi"
                value={promoEmails}
                onValueChange={setPromoEmails}
              />
            </Card>
          )}

          {/* Tab 4: Live Support */}
          {activeTab === 'support' && (
            <Card style={{ padding: 16, gap: 14, backgroundColor: '#FFFFFF' }}>
              <AvatarHeader
                iconName="question"
                title="Soporte Platzi VIP"
                subtitle="Atención personalizada las 24 horas del día"
              />

              <Body style={{ lineHeight: 20, color: '#475569', textAlign: 'center' }}>
                ¿Tienes alguna consulta con tu pedido o pago? Nuestro equipo de soporte está disponible.
              </Body>

              <Button
                title="Conectar con Agente en Vivo"
                variant="primary"
                onPress={() => {
                  toast.show({
                    title: 'Conectando Chat',
                    message: 'Un especialista de Platzi se conectará en un momento.',
                    variant: 'info',
                  });
                }}
              />
            </Card>
          )}

          {/* Logout Action Button */}
          <Button
            title="Cerrar Sesión"
            variant="destructive"
            onPress={handleLogout}
          />
        </View>
      ) : (
        // Login Form
        <Card style={{ padding: 20, gap: 16 }}>
          <AvatarHeader
            iconName="info"
            title="Iniciar Sesión"
            subtitle="Platzi Auth API Clean Architecture"
          />

          <Input
            label="Correo Electrónico"
            placeholder="john@mail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Contraseña"
            placeholder="changeme"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          {error && (
            <Caption color="#EF4444" style={{ fontWeight: 'bold' }}>
              {error}
            </Caption>
          )}

          <Button
            title={isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
            variant="primary"
            disabled={isLoading}
            onPress={handleLogin}
          />

          <Card style={{ backgroundColor: '#F1F5F9', padding: 12, gap: 4 }}>
            <Caption color="#475569" style={{ fontWeight: 'bold' }}>
              Credenciales Demo Platzi API:
            </Caption>
            <Caption color="#64748B">Email: john@mail.com</Caption>
            <Caption color="#64748B">Password: changeme</Caption>
          </Card>
        </Card>
      )}

      {/* Add Card Overlay Modal */}
      <Modal
        variant="overlay"
        title="Agregar Nueva Tarjeta"
        visible={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
      >
        <View style={{ gap: 12 }}>
          <Input
            label="Número de Tarjeta"
            placeholder="4532 •••• •••• 9999"
            keyboardType="numeric"
            value={newCardNumber}
            onChangeText={setNewCardNumber}
          />
          <Input
            label="Nombre del Titular"
            placeholder="DAVID ALEXANDER"
            value={newCardHolder}
            onChangeText={setNewCardHolder}
          />
          <Input
            label="Vencimiento (MM/AA)"
            placeholder="12/28"
            value={newCardExpiry}
            onChangeText={setNewCardExpiry}
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Button
              title="Cancelar"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setIsAddCardOpen(false)}
            />
            <Button
              title="Guardar Tarjeta"
              variant="primary"
              style={{ flex: 1 }}
              onPress={handleSaveNewCard}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
