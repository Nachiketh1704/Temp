/**
 * PaymentMethod Screen
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  CreditCard,
  Plus,
  ChevronRight,
  Check,
  Trash2,
  BanknoteIcon,
  ArrowLeft,
  CreditCardIcon,
} from 'lucide-react-native';

//Screens
import { Colors } from '@app/styles';
import { usePaymentStore } from '@app/store/paymentStore';
import { Button } from '@app/components/Button';
import { useThemedStyle } from '@app/styles';
import { Routes } from '../../../navigator';
import { getStyles } from './styles';


function PaymentMethodsScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { paymentMethods, setDefaultPaymentMethod, removePaymentMethod } =
    usePaymentStore();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleSetDefault = (methodId: string) => {
    setDefaultPaymentMethod(methodId);
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleRemove = (methodId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removePaymentMethod(methodId);
            Alert.alert('Success', 'Payment method removed');
          },
        },
      ],
    );
  };

  const renderPaymentMethodItem = (method: any) => {
    const isSelected = selectedMethod === method.id;
    const cardTypeIcon = () => {
      switch (method.type) {
        case 'visa':
          return <CreditCardIcon size={24} color={Colors.primary} />;
        case 'mastercard':
          return <CreditCardIcon size={24} color={Colors.primary} />;
        case 'bank':
          return <BanknoteIcon size={24} color={Colors.primary} />;
        default:
          return <CreditCard size={24} color={Colors.primary} />;
      }
    };

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodItem,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => setSelectedMethod(isSelected ? null : method.id)}
      >
        <View style={styles.paymentMethodIconContainer}>{cardTypeIcon()}</View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {method.type === 'bank'
              ? 'Bank Account'
              : `${method.brand} ****${method.last4}`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {method.type === 'bank'
              ? `${method.bankName} - ${method.accountType}`
              : `Expires ${method.expMonth}/${method.expYear}`}
          </Text>
        </View>

        {method.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}

        {isSelected ? (
          <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(method.id)}
              disabled={method.isDefault}
            >
              <Check
                size={20}
                color={method.isDefault ? Colors.textSecondary : Colors.success}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRemove(method.id)}
              disabled={method.isDefault}
            >
              <Trash2
                size={20}
                color={method.isDefault ? Colors.textSecondary : Colors.error}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <ChevronRight size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionDescription}>
          Manage your payment methods for receiving payments or paying for
          services.
        </Text>

        {paymentMethods.length > 0 ? (
          paymentMethods.map(method => renderPaymentMethodItem(method))
        ) : (
          <View style={styles.emptyState}>
            <CreditCard size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
            <Text style={styles.emptyStateDescription}>
              Add a payment method to receive payments or pay for services.
            </Text>
          </View>
        )}

        <Button
          title="Add New Payment Method"
          variant="primary"
          icon={<Plus size={20} color={Colors.white} />}
          onPress={() => navigation.navigate(Routes.AddPaymentMethodScreen)}
          style={styles.addButton}
        />
      </ScrollView>
    </View>
  );
}

export { PaymentMethodsScreen };
