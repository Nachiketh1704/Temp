/**
 * WithdrawPayment Screen
 * @format
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  CreditCard,
  BanknoteIcon,
  Check,
  CreditCardIcon,
} from 'lucide-react-native';

//Screens
import { Colors } from '@app/styles';
import { useAuthStore } from '@app/store/authStore';
import { usePaymentStore } from '@app/store/paymentStore';
import { formatCurrency } from '@app/utils/formatters';
import { Button } from '@app/components/Button';
import { Input } from '@app/components/Input';
import { useThemedStyle } from '@app/styles';
import { Routes } from '../../../navigator';
import { getStyles } from './styles';


function WithdrawScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { userProfile } = useAuthStore();
  const { balance, paymentMethods, withdrawFunds } = usePaymentStore();

  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Find default payment method
  const defaultMethod = paymentMethods.find(method => method.isDefault);

  // If there's a default method and no method is selected, select the default
  if (defaultMethod && !selectedMethodId) {
    setSelectedMethodId(defaultMethod.id);
  }

  const handleAmountChange = (text: string) => {
    // Remove all non-digits and non-decimal points
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }

    // Limit to 2 decimal places
    if (parts.length > 1 && parts[1].length > 2) {
      return;
    }

    setAmount(cleaned);
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (parseFloat(amount) > balance) {
      Alert.alert('Error', 'Withdrawal amount exceeds your available balance');
      return false;
    }

    if (!selectedMethodId) {
      Alert.alert('Error', 'Please select a payment method');
      return false;
    }

    return true;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // In a real app, we would call an API to process the withdrawal
      // For now, we'll just update the local state

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Make sure selectedMethodId is not null before passing to withdrawFunds
      if (selectedMethodId) {
        withdrawFunds(parseFloat(amount), selectedMethodId);

        Alert.alert(
          'Withdrawal Initiated',
          `Your withdrawal of ${formatCurrency(
            parseFloat(amount),
            'USD',
          )} has been initiated and will be processed within 1-3 business days.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate(Routes.PaymentScreen),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodItem = (method: any) => {
    const isSelected = selectedMethodId === method.id;
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
        onPress={() => setSelectedMethodId(method.id)}
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

        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Check size={20} color={Colors.primary} />
          </View>
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
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(balance, 'USD')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Withdrawal Amount</Text>

          <View style={styles.amountInputContainer}>
            <View style={styles.currencyContainer}>
              <Text style={styles.currencySymbol}>$</Text>
            </View>
            <Input
              placeholder="0.00"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>

          <TouchableOpacity
            style={styles.maxButton}
            onPress={() => setAmount(balance.toString())}
          >
            <Text style={styles.maxButtonText}>Max Amount</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Withdraw To</Text>

          {paymentMethods.length > 0 ? (
            paymentMethods.map(method => renderPaymentMethodItem(method))
          ) : (
            <View style={styles.noMethodsContainer}>
              <Text style={styles.noMethodsText}>
                You don't have any payment methods set up yet.
              </Text>
              <Button
                title="Add Payment Method"
                variant="outline"
                onPress={() => navigation.navigate(Routes.AddPaymentMethodScreen)}
                style={styles.addMethodButton}
              />
            </View>
          )}

          <Button
            title={`Withdraw ${
              amount ? formatCurrency(parseFloat(amount) || 0, 'USD') : ''
            }`}
            variant="primary"
            onPress={handleWithdraw}
            loading={loading}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > balance ||
              !selectedMethodId
            }
            style={styles.withdrawButton}
          />

          <Text style={styles.withdrawalNote}>
            Withdrawals typically take 1-3 business days to process depending on
            your payment method.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export { WithdrawScreen };
