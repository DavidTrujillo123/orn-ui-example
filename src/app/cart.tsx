import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Title, Subtitle, Body, Caption } from 'orn-ui/title';
import { Gradient } from 'orn-ui/gradient';
import { ReorderableList } from 'orn-ui/reorderable-list';
import { Timeline } from 'orn-ui/timeline';
import { DateField } from 'orn-ui/date-field';
import { Alert } from 'orn-ui/alert';
import { useAlert, showConfirm } from 'orn-ui/use-alert';
import { useToast, showToast, hideToast, hideAllToasts } from 'orn-ui/use-toast';
import { useColors } from 'orn-ui/theme';
import { Card } from 'orn-ui/card';
import { Button } from 'orn-ui/button';
import { Image } from 'orn-ui/image';
import { KeyValueRow } from 'orn-ui/key-value-row';
import { Stepper } from 'orn-ui/stepper';
import { EmptyState } from 'orn-ui/empty-state';
import { OptionCard } from 'orn-ui/option-card';
import { Input } from 'orn-ui/input';
import { Modal } from 'orn-ui/modal';
import { Wizard, type WizardStep } from 'orn-ui/wizard';
import { AvatarHeader } from 'orn-ui/avatar-header';
import { Checkbox } from 'orn-ui/checkbox';
import { Select } from 'orn-ui/select';
import { Steps } from 'orn-ui/steps';
import { Divider } from 'orn-ui/divider';
import { InfoRow } from 'orn-ui/info-row';
import { Badge } from 'orn-ui/badge';
import { Screen } from 'orn-ui/screen';

import { useCart } from '@/presentation/state/CartContext';

const CART_ROW_HEIGHT = 142;

// iOS no puede presentar un modal nativo mientras otro se está cerrando: el
// nuevo queda sin mostrarse y su promesa nunca resuelve (la app parece
// colgada). El Modal de orn-ui anima su salida 250ms; esperamos un poco más
// antes de abrir el siguiente.
const MODAL_EXIT_MS = 400;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TRACKING_STAGES = [
  { label: 'Pago Confirmado', emoji: '💳' },
  { label: 'Almacén', emoji: '📦' },
  { label: 'En Ruta', emoji: '🚚' },
  { label: 'Entregado', emoji: '🏠' },
];

interface PresetCard {
  id: string;
  bank: string;
  number: string;
  holder: string;
  expiry: string;
  type: 'visa' | 'mastercard' | 'amex';
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, updateQuantity, removeFromCart, clearCart, reorderItems, totalAmount, totalItems } = useCart();
  const colors = useColors();
  const toast = useToast();
  const { alert } = useAlert();

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isAbandonAlertOpen, setIsAbandonAlertOpen] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const isPayingRef = useRef(false);

  // Form State for Checkout Wizard Steps
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('MX');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card');
  const [selectedPresetCardId, setSelectedPresetCardId] = useState<string>('c1');
  const [cardType, setCardType] = useState('visa');
  const [cardNumber, setCardNumber] = useState('4532892100414242');
  const [cardHolder, setCardHolder] = useState('DAVID ALEXANDER');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [saveCard, setSaveCard] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(true);

  // Live Tracking Simulation State
  const [trackingStep, setTrackingStep] = useState<number>(1);
  const [trackingCode, setTrackingCode] = useState<string>('PLZ-894129');

  const presetCards: PresetCard[] = [
    {
      id: 'c1',
      bank: 'Platzi Black Card',
      number: '4532 •••• •••• 4242',
      holder: 'DAVID ALEXANDER',
      expiry: '12/28',
      type: 'visa',
    },
    {
      id: 'c2',
      bank: 'Mastercard Gold',
      number: '5500 •••• •••• 8888',
      holder: 'DAVID ALEXANDER',
      expiry: '09/27',
      type: 'mastercard',
    },
    {
      id: 'c3',
      bank: 'Amex Centurion',
      number: '3782 •••• •••• 9999',
      holder: 'DAVID ALEXANDER',
      expiry: '04/29',
      type: 'amex',
    },
  ];

  const countryOptions = [
    { label: 'México (MX)', value: 'MX' },
    { label: 'Colombia (CO)', value: 'CO' },
    { label: 'Argentina (AR)', value: 'AR' },
    { label: 'Chile (CL)', value: 'CL' },
    { label: 'España (ES)', value: 'ES' },
  ];

  const cardTypeOptions = [
    { label: 'Visa Debito/Credito', value: 'visa' },
    { label: 'Mastercard World', value: 'mastercard' },
    { label: 'American Express', value: 'amex' },
  ];

  const handleSelectPresetCard = (card: PresetCard) => {
    setSelectedPresetCardId(card.id);
    setCardType(card.type);
    setCardNumber(card.number.replace(/ /g, ''));
    setCardHolder(card.holder);
    setCardExpiry(card.expiry);
  };

  // Usa la API imperativa (showConfirm/showToast): mismo resultado que los
  // hooks, pero invocable desde código fuera de React.
  const handleClearCart = async () => {
    const isOk = await showConfirm({
      title: 'Vaciar Carrito',
      message: '¿Deseas remover todos los productos de tu carrito?',
      confirmText: 'Vaciar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (isOk) {
      clearCart();
      setReorderMode(false);
      showToast({
        title: 'Carrito Vaciado',
        message: 'Se han eliminado todos los productos.',
        variant: 'info',
      });
    }
  };

  const handleOpenCheckout = () => {
    hideAllToasts();
    setIsCheckoutModalOpen(true);
  };

  const handleFinishWizard = async () => {
    // Evita procesar dos veces si tocan "Confirmar Pago" repetido.
    if (isPayingRef.current) return;
    isPayingRef.current = true;

    setIsCheckoutModalOpen(false);
    await wait(MODAL_EXIT_MS);

    // Ya sin el modal encima, el toast sí se ve.
    const processingId = showToast({
      title: 'Procesando pago...',
      message: 'Validando con tu banco.',
      variant: 'info',
    });
    await wait(800);
    hideToast(processingId);

    const newCode = `PLZ-${Math.floor(100000 + Math.random() * 900000)}`;
    setTrackingCode(newCode);
    setTrackingStep(0);

    await alert({
      title: '¡Orden Procesada con Éxito!',
      message: `Tu pago de $${totalAmount.toFixed(2)} mediante Tarjeta (${cardType.toUpperCase()}) fue aceptado.\n\nCódigo de Rastreo: #${newCode}`,
      type: 'info',
      confirmText: 'Rastrear Pedido',
    });
    // El alert también es un modal nativo: dejar que termine de cerrarse.
    await wait(MODAL_EXIT_MS);

    clearCart();
    isPayingRef.current = false;
    // Open Live Tracking Modal
    setIsTrackingModalOpen(true);
    toast.show({
      title: '¡Compra Confirmada!',
      message: `Rastrea tu envío con la guía #${newCode}.`,
      variant: 'success',
    });
  };

  const handleAdvanceTracking = () => {
    if (trackingStep < 3) {
      const nextStep = trackingStep + 1;
      setTrackingStep(nextStep);
      const stepNames = ['Pago Confirmado', 'Empacando en Almacén', 'En Ruta de Entrega', '¡Entregado!'];
      toast.show({
        title: 'Estado del Envío Actualizado',
        message: `Nuevo Estado: ${stepNames[nextStep]}`,
        variant: 'info',
      });
    } else {
      toast.show({
        title: 'Pedido Entregado',
        message: 'El pedido fue recibido con éxito.',
        variant: 'success',
      });
    }
  };

  // Steps definition for Checkout Wizard
  const checkoutSteps: WizardStep[] = [
    // Step 1: Shipping Address & Country Select
    {
      label: 'Dirección',
      description: 'Datos de Envío',
      canGoNext: address.trim().length > 3 && city.trim().length > 1,
      content: (
        <View style={{ gap: 14, paddingVertical: 8 }}>
          <AvatarHeader
            iconName="info"
            title="Dirección de Envío"
            subtitle="Ingresa la ubicación para recibir tu compra"
          />
          <Input
            label="Dirección de Entrega *"
            placeholder="Calle Principal #123, Apto 4B"
            value={address}
            onChangeText={setAddress}
          />
          <Input
            label="Ciudad *"
            placeholder="Ciudad de México / Bogotá / Buenos Aires"
            value={city}
            onChangeText={setCity}
          />
          <Select
            label="País de Residencia *"
            options={countryOptions}
            selectedValue={country}
            onSelect={setCountry}
          />
          <DateField
            label="Fecha de entrega preferida"
            placeholder="Lo antes posible"
            modalTitle="Elige un día de entrega"
            value={deliveryDate}
            onChange={setDeliveryDate}
            onClear={() => setDeliveryDate(undefined)}
            minDate={new Date()}
            firstDayOfWeek={1}
          />
        </View>
      ),
    },
    // Step 2: Payment Method & Interactive Card
    {
      label: 'Tarjeta & Pago',
      description: 'Método de Pago',
      canGoNext: paymentMethod !== 'card' || cardNumber.trim().length >= 12,
      content: (
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <AvatarHeader
            iconName="check"
            title="Selección de Pago"
            subtitle="Elige tu método de pago preferido"
          />

          {/* Payment Method Selector */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <OptionCard
              label="Tarjeta"
              iconName="check"
              isSelected={paymentMethod === 'card'}
              onPress={() => setPaymentMethod('card')}
            />
            <OptionCard
              label="Efectivo"
              iconName="info"
              isSelected={paymentMethod === 'cash'}
              onPress={() => setPaymentMethod('cash')}
            />
            <OptionCard
              label="Transferencia"
              iconName="plus"
              isSelected={paymentMethod === 'transfer'}
              onPress={() => setPaymentMethod('transfer')}
            />
          </View>

          {paymentMethod === 'card' ? (
            <View style={{ gap: 14 }}>
              {/* Interactive Bank Card Preview */}
              <Gradient
                colors={['#0F172A', '#1E3A8A']}
                direction="diagonal"
                style={{ padding: 20, borderRadius: 20, gap: 16 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title color="#FFFFFF" style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }}>
                    {presetCards.find((c) => c.id === selectedPresetCardId)?.bank || 'Tarjeta de Crédito'}
                  </Title>
                  <Badge
                    label={cardType.toUpperCase()}
                    variant="info"
                    backgroundColor="#2563EB"
                    textColor="#FFFFFF"
                  />
                </View>

                {/* Simulated Chip */}
                <View
                  style={{
                    width: 40,
                    height: 28,
                    backgroundColor: '#F59E0B',
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#D97706',
                  }}
                />

                {/* Card Number */}
                <Title color="#FFFFFF" style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: 3 }}>
                  {cardNumber ? cardNumber.replace(/(.{4})/g, '$1 ').trim() : '4532 •••• •••• 8921'}
                </Title>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Caption color="#94A3B8" style={{ fontSize: 10 }}>
                      TITULAR
                    </Caption>
                    <Title color="#FFFFFF" style={{ fontSize: 13, fontWeight: 'bold' }}>
                      {cardHolder || 'NOMBRE EN TARJETA'}
                    </Title>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Caption color="#94A3B8" style={{ fontSize: 10 }}>
                      VENCIMIENTO
                    </Caption>
                    <Title color="#FFFFFF" style={{ fontSize: 13, fontWeight: 'bold' }}>
                      {cardExpiry || '12/28'}
                    </Title>
                  </View>
                </View>
              </Gradient>

              {/* Selector de Tarjetas Guardadas */}
              <Subtitle style={{ fontSize: 14, fontWeight: '700' }}>Usar Tarjeta Guardada:</Subtitle>
              <View style={{ gap: 8 }}>
                {presetCards.map((card) => (
                  <OptionCard
                    key={card.id}
                    label={`${card.bank} (${card.number})`}
                    iconName={selectedPresetCardId === card.id ? 'check' : 'info'}
                    isSelected={selectedPresetCardId === card.id}
                    onPress={() => handleSelectPresetCard(card)}
                  />
                ))}
              </View>

              {/* Manual Input Fields */}
              <Card style={{ padding: 14, gap: 12 }}>
                <Select
                  label="Tipo de Tarjeta"
                  options={cardTypeOptions}
                  selectedValue={cardType}
                  onSelect={setCardType}
                />
                <Input
                  label="Nombre en la Tarjeta"
                  value={cardHolder}
                  onChangeText={setCardHolder}
                />
                <Input
                  label="Número de Tarjeta"
                  placeholder="4532892100414242"
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
                <Input
                  label="Fecha de Expiración"
                  placeholder="12/28"
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                />
                <Checkbox
                  label="Guardar esta tarjeta para compras futuras"
                  value={saveCard}
                  onValueChange={setSaveCard}
                />
              </Card>
            </View>
          ) : (
            <Card style={{ padding: 14, gap: 6 }}>
              <Subtitle style={{ fontWeight: 'bold' }}>Instrucciones de Pago:</Subtitle>
              <Caption>
                {paymentMethod === 'cash'
                  ? 'Realizarás el pago en efectivo al recibir el paquete en tu domicilio.'
                  : 'Recibirás los datos bancarios y referencia tras confirmar el pedido.'}
              </Caption>
            </Card>
          )}
        </View>
      ),
    },
    // Step 3: Terms and Conditions
    {
      label: 'Términos',
      description: 'Condiciones Legales',
      canGoNext: acceptTerms,
      content: (
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <AvatarHeader
            iconName="warning"
            title="Términos y Condiciones"
            subtitle="Revisa las políticas antes de confirmar"
          />

          <Card style={{ padding: 14, gap: 10 }}>
            <Subtitle style={{ fontWeight: 'bold' }}>Garantía de Satisfacción y Devolución</Subtitle>
            <Body style={{ fontSize: 13, lineHeight: 18 }}>
              Todos los productos cuentan con 30 días de garantía. Las devoluciones son sencillas y 100% gratuitas.
            </Body>
          </Card>

          <Divider />

          <View style={{ gap: 8 }}>
            <Checkbox
              label="He leído y acepto los Términos y Condiciones *"
              value={acceptTerms}
              onValueChange={setAcceptTerms}
            />
            <Checkbox
              label="Deseo recibir ofertas y promociones exclusivas por email"
              value={marketingEmail}
              onValueChange={setMarketingEmail}
            />
          </View>

          {!acceptTerms && (
            <Caption color={colors.errorText} style={{ fontWeight: 'bold' }}>
              * Debes aceptar los Términos y Condiciones para avanzar.
            </Caption>
          )}
        </View>
      ),
    },
    // Step 4: Final Summary
    {
      label: 'Confirmación',
      description: 'Resumen Final',
      content: (
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <AvatarHeader
            iconName="question"
            title="Resumen del Pedido"
            subtitle="Línea de tiempo de entrega estimada"
          />

          {/* Timeline Steps */}
          <Card style={{ padding: 14 }}>
            <Title style={{ fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
              Etapas del Envío:
            </Title>
            <Steps
              steps={[
                { label: 'Pago Confirmado', description: 'Inmediato' },
                { label: 'Empaque en Almacén', description: '24 Horas' },
                { label: 'En Ruta Express', description: 'En camino' },
                { label: 'Entregado', description: 'Destino final' },
              ]}
              current={0}
            />
          </Card>

          <Card style={{ padding: 16, gap: 8 }}>
            <Subtitle style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              Desglose de Compra:
            </Subtitle>
            <KeyValueRow label="Productos Totales" value={`${totalItems} ítems`} />
            <KeyValueRow label="Destino" value={`${address || 'Av. Insurgentes 42'}, ${city || 'CDMX'}`} />
            <KeyValueRow label="Método de Pago" value={paymentMethod.toUpperCase()} />
            <KeyValueRow label="Total a Pagar" value={`$${totalAmount.toFixed(2)}`} />
          </Card>
        </View>
      ),
    },
  ];

  return (
    <Screen scrollable={false} edges={['top']} style={{ paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Title style={{ fontSize: 24, fontWeight: '800' }}>Carrito de Compras</Title>
          <Caption>{totalItems} productos seleccionados</Caption>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {items.length > 1 && (
            <Button
              title={reorderMode ? 'Listo' : 'Ordenar'}
              variant={reorderMode ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => setReorderMode((v) => !v)}
            />
          )}
          <Button
            title="Rastreo"
            variant="outline"
            size="sm"
            onPress={() => setIsTrackingModalOpen(true)}
          />

          {items.length > 0 && (
            <Button
              title="Vaciar"
              variant="outline"
              size="sm"
              onPress={handleClearCart}
            />
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Tu carrito está vacío"
          description="Explora el catálogo de productos y añade tus artículos favoritos."
        />
      ) : (
        <View style={{ flex: 1 }}>
          {reorderMode && (
            <Caption style={{ marginBottom: 8 }}>Arrastra los productos para cambiar su orden.</Caption>
          )}
          <ScrollView
            scrollEnabled={!dragging}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <ReorderableList
              data={items}
              keyExtractor={(item) => item.product.id.toString()}
              itemHeight={CART_ROW_HEIGHT}
              disabled={!reorderMode}
              onReorder={reorderItems}
              onDragStart={() => setDragging(true)}
              onDragEnd={() => setDragging(false)}
              renderItem={(item, _index, isDragging) => (
                <Card
                  style={{
                    height: CART_ROW_HEIGHT - 14,
                    padding: 14,
                    flexDirection: 'row',
                    gap: 14,
                    alignItems: 'center',
                    opacity: isDragging ? 0.85 : 1,
                    borderWidth: reorderMode ? 1 : 0,
                    borderColor: isDragging ? colors.primary : colors.border,
                  }}
                >
                  <Image
                    source={{ uri: item.product.images[0] }}
                    width={70}
                    height={70}
                    radius={12}
                  />

                  <View style={{ flex: 1, gap: 4 }}>
                    <Subtitle numberOfLines={1} style={{ fontSize: 15, fontWeight: '700' }}>
                      {item.product.title}
                    </Subtitle>
                    <Title color={colors.primaryText} style={{ fontSize: 16, fontWeight: 'bold' }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </Title>

                    <View style={{ marginTop: 6, width: 120 }}>
                      <Stepper
                        value={item.quantity.toString()}
                        editable={!reorderMode}
                        onChangeText={(val) => {
                          const parsed = parseInt(val, 10);
                          if (!isNaN(parsed)) updateQuantity(item.product.id, parsed);
                        }}
                        onIncrement={() => updateQuantity(item.product.id, item.quantity + 1)}
                        onDecrement={() => updateQuantity(item.product.id, item.quantity - 1)}
                        size="sm"
                      />
                    </View>
                  </View>

                  {!reorderMode && (
                    <Button
                      title="X"
                      variant="outline"
                      size="sm"
                      onPress={() => removeFromCart(item.product.id)}
                    />
                  )}
                </Card>
              )}
            />
          </ScrollView>

          {/* Checkout Summary Footer */}
          <Card style={{ padding: 16, gap: 10, marginBottom: insets.bottom + 16 }}>
            <KeyValueRow label="Subtotal" value={`$${totalAmount.toFixed(2)}`} />
            <KeyValueRow label="Envío Express" value="GRATIS" />
            <KeyValueRow label="Total a Pagar" value={`$${totalAmount.toFixed(2)}`} />

            <Button
              title="Proceder al Pago"
              variant="primary"
              style={{ marginTop: 8 }}
              onPress={handleOpenCheckout}
            />
          </Card>
        </View>
      )}

      {/* Full Screen Checkout Wizard Modal */}
      <Modal
        variant="full"
        title="Proceso de Compra"
        visible={isCheckoutModalOpen}
        onClose={() => setIsAbandonAlertOpen(true)}
        scrollable={false}
        contentStyle={{ padding: 16 }}
      >
        <Wizard
          steps={checkoutSteps}
          backLabel="Anterior"
          nextLabel="Siguiente"
          finishLabel="Confirmar Pago"
          onFinish={handleFinishWizard}
        />

        {/* inline: se dibuja dentro de este Modal en vez de abrir otro encima */}
        <Alert
          inline
          visible={isAbandonAlertOpen}
          type="question"
          title="¿Abandonar la compra?"
          message="Tus datos de envío y pago se conservan hasta que cierres la app."
          confirmText="Salir"
          cancelText="Seguir comprando"
          onConfirm={() => {
            setIsAbandonAlertOpen(false);
            setIsCheckoutModalOpen(false);
          }}
          onCancel={() => setIsAbandonAlertOpen(false)}
          onClose={() => setIsAbandonAlertOpen(false)}
        />
      </Modal>

      {/* Live Tracking Simulator Overlay Modal */}
      <Modal
        variant="overlay"
        title="Rastreo de Envío"
        visible={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      >
        <ScrollView contentContainerStyle={{ gap: 16, paddingVertical: 8 }}>
          <AvatarHeader
            iconName="info"
            title={`Guía #${trackingCode}`}
            subtitle="Seguimiento de paquete en tiempo real"
          />

          <Card style={{ padding: 16, gap: 14 }}>
            <Title style={{ fontSize: 16, fontWeight: '700' }}>Progreso de la Entrega:</Title>
            <Timeline
              items={TRACKING_STAGES.map((stage, i) => ({
                label: stage.label,
                emoji: stage.emoji,
                status: i <= trackingStep ? 'done' : 'pending',
              }))}
              selectedIndex={trackingStep}
              spacing={72}
            />
          </Card>

          <Card style={{ padding: 16, gap: 12 }}>
            <Title style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              Detalles del Rastreo:
            </Title>
            <InfoRow
              icon="info"
              label="Número de Guía"
              value={`#${trackingCode}`}
              placeholder="N/A"
            />
            <InfoRow
              icon="check"
              label="Empresa de Envío"
              value="Platzi Express Logistics"
              placeholder="Platzi Express"
            />
            <InfoRow
              icon="warning"
              label="Estimado de Entrega"
              value={trackingStep === 3 ? '¡Entregado!' : 'Llega hoy antes de las 6:00 PM'}
              placeholder="Pendiente"
            />
          </Card>

          <Button
            title={trackingStep < 3 ? "Simular Avanzar Envío" : "Pedido Entregado"}
            variant="primary"
            disabled={trackingStep >= 3}
            onPress={handleAdvanceTracking}
          />
        </ScrollView>
      </Modal>
    </Screen>
  );
}
