<template>
  <div class="tip-form">
    <h1>Pagos</h1>
    <!--aqui se muestra el total de propinas y efectivo disponible-->
    <div class="tip-info">
      <div class="tip-total">
        <span>Total de Propinas</span>
        <div class="editable-amount">
          $<input v-model.number="tipAmount" type="number" step="0.01" @input="updateTipAmount" />
        </div>
      </div>
      <div class="cash-in-register">
        <span>Efectivo en Caja</span>
        <span class="amount">${{ formatNumber(cashInRegister) }}</span>
      </div>
    </div>

    <!--numpad para ingresar cantidad de empleados-->
    <div class="tip-distribution">
      <h2>¿Entre cuántos quieres dividir las Propinas?</h2>
      <div class="number-pad">
        <button v-for="n in 9" :key="n" @click="updateEmployeeCount(n)">{{ n }}</button>
        <button @click="clearEmployeeCount">C</button>
        <button @click="updateEmployeeCount(0)">0</button>
        <button @click="deleteLastDigit">
          <font-awesome-icon icon="backspace" />
        </button>
      </div>
      <input v-model="numberOfEmployees" type="number" class="employee-count" readonly />
    </div>

    <!--resumen de pagos y distribución por persona-->
    <div class="payment-info">
      <div class="payment-row">
        <span>Total Pagado</span>
        <span class="amount">${{ formatNumber(totalPaid) }}</span>
      </div>
      <div class="payment-row">
        <span>Restante por Pagar</span>
        <span class="amount">${{ formatNumber(remainingToPay) }}</span>
      </div>
      <div class="payment-row">
        <span>{{ formatNumber(tipPerPerson) }} por Persona</span>
      </div>
    </div>

    <!--aqui seleccionamos los métodos de pago (efectivo o tarjetas)-->
    <div class="payment-methods">
      <h3>Elige el Método de Pago</h3>
      <div class="method-buttons">
        <button
          v-for="method in paymentMethods"
          :key="method.name"
          @click="selectPaymentMethod(method)"
          :class="{ active: selectedMethod === method }"
        >
          <font-awesome-icon :icon="method.type === 'cash' ? 'money-bill' : 'credit-card'" />
          {{ method.name }}
        </button>
      </div>
    </div>

    <!--input de monto a pagar-->
    <div class="payment-amount" v-if="selectedMethod">
      <input
        v-model.number="currentPaymentAmount"
        type="number"
        step="0.01"
        :placeholder="`Cantidad Restante $${formatNumber(remainingToPay)}`"
      />
      <button @click="addPayment" :disabled="!canAddPayment">
        Pagar ${{ formatNumber(currentPaymentAmount) }} en Propinas
      </button>
    </div>

    <!--una lista de pagos realizados-->
    <div class="payments-list">
      <div v-for="(payment, index) in payments" :key="index" class="payment-item">
        <font-awesome-icon :icon="payment.method === 'Efectivo' ? 'money-bill' : 'credit-card'" />
        <span>{{ payment.method }}</span>
        <span>${{ formatNumber(payment.amount) }}</span>
        <button class="remove-button" @click="removePayment(index)">X</button>
      </div>
    </div>

    <!--botones de acción principal-->
    <div class="action-buttons">
      <button class="back-button">Atrás</button>
      <button class="pay-button" @click="submitTip" :disabled="remainingToPay > 0">
        Pagar Propinas
      </button>
      <button
        class="generate-receipt-button"
        @click="generateReceipt"
        :disabled="remainingToPay > 0"
      >
        <font-awesome-icon icon="file-alt" /> Generar Recibo
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faMoneyBill,
  faCreditCard,
  faBackspace,
  faFileAlt,
} from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'

//esta es una librería de iconos usados
library.add(faMoneyBill, faCreditCard, faBackspace, faFileAlt)

//interfaces para tipado de datos
export interface Payment {
  method: string
  amount: number
}

export interface PaymentMethod {
  name: string
  type: string
}

export default defineComponent({
  name: 'TipForm',
  components: {
    FontAwesomeIcon,
  },
  setup() {
    //estado inicial del formulario
    const tipAmount = ref<number>(0) //monto total de propinas
    const cashInRegister = ref<number>(5500) //dinero en caja
    const numberOfEmployees = ref<number>(0) //cantidad de empleados
    const payments = ref<Payment[]>([]) //pagos realizados
    const currentPaymentAmount = ref<number>(0) //monto actual a pagar
    const selectedMethod = ref<PaymentMethod | null>(null) //método de pago seleccionado

    //aqui estan los métodos de pago disponibles
    const paymentMethods: PaymentMethod[] = [
      { name: 'Efectivo', type: 'cash' },
      { name: 'Santander 1234', type: 'card' },
      { name: 'BBVA 1234', type: 'card' },
    ]

    //computed properties para cálculos
    const totalPaid = computed(() =>
      payments.value.reduce((sum, payment) => sum + payment.amount, 0),
    )

    const remainingToPay = computed(() => Math.max(0, tipAmount.value - totalPaid.value))

    const tipPerPerson = computed(() =>
      numberOfEmployees.value > 0 ? tipAmount.value / numberOfEmployees.value : 0,
    )

    const canAddPayment = computed(
      () => currentPaymentAmount.value > 0 && currentPaymentAmount.value <= remainingToPay.value,
    )

    //métodos que se usan para gestionar la entrada de empleados
    const updateEmployeeCount = (digit: number) => {
      if (numberOfEmployees.value < 99) {
        numberOfEmployees.value = numberOfEmployees.value * 10 + digit
      }
    }

    const clearEmployeeCount = () => {
      numberOfEmployees.value = 0
    }

    const deleteLastDigit = () => {
      numberOfEmployees.value = Math.floor(numberOfEmployees.value / 10)
    }

    //métodos para gestionar los pagos
    const selectPaymentMethod = (method: PaymentMethod) => {
      selectedMethod.value = method
      currentPaymentAmount.value = remainingToPay.value
    }

    const addPayment = () => {
      if (selectedMethod.value && canAddPayment.value) {
        payments.value.push({
          method: selectedMethod.value.name,
          amount: currentPaymentAmount.value,
        })
        currentPaymentAmount.value = 0
        selectedMethod.value = null
      }
    }

    const removePayment = (index: number) => {
      payments.value.splice(index, 1)
    }

    //utilidades
    const formatNumber = (value: number): string => {
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    const updateTipAmount = () => {
      //actualizar monto de propinas
      if (tipAmount.value < totalPaid.value) {
        tipAmount.value = totalPaid.value
      }
    }

    //aqui están los métodos para enviar datos al servidor
    const submitTip = async () => {
      if (remainingToPay.value === 0) {
        try {
          const tipData = {
            //datos que se envian al servidor
            amount: tipAmount.value,
            totalEmployees: numberOfEmployees.value,
            payments: payments.value,
          }

          const response = await fetch('http://localhost:3000/api/tips', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(tipData),
          })

          if (!response.ok) {
            throw new Error('Error al guardar la propina')
          }

          const result = await response.json()
          console.log('Propina registrada:', result)

          //limpiamos formulario después de enviar
          tipAmount.value = 0
          numberOfEmployees.value = 0
          payments.value = []
        } catch (error) {
          console.error('Error:', error)
        }
      }
    }

    const generateReceipt = async () => {
      //generar recibo en pdf
      if (remainingToPay.value === 0) {
        try {
          const receiptData = {
            totalTip: tipAmount.value,
            totalEmployees: numberOfEmployees.value,
            tipPerPerson: tipPerPerson.value,
            payments: payments.value,
            date: new Date().toISOString(),
          }

          const response = await fetch('http://localhost:3000/api/generate-receipt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(receiptData),
          })

          if (!response.ok) {
            throw new Error('Error al generar el recibo')
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = 'recibo-propinas.pdf'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Error:', error)
        }
      }
    }

    return {
      tipAmount,
      cashInRegister,
      numberOfEmployees,
      payments,
      currentPaymentAmount,
      selectedMethod,
      paymentMethods,
      totalPaid,
      remainingToPay,
      tipPerPerson,
      canAddPayment,
      updateEmployeeCount,
      clearEmployeeCount,
      deleteLastDigit,
      selectPaymentMethod,
      addPayment,
      removePayment,
      formatNumber,
      updateTipAmount,
      submitTip,
      generateReceipt,
    }
  },
})
</script>

<style scoped>
.tip-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h1,
h2,
h3 {
  color: #333333;
  margin-bottom: 15px;
}

.tip-info,
.payment-info {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.tip-total,
.cash-in-register,
.payment-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
}

.amount {
  font-weight: bold;
  font-size: 1.2em;
  color: #007bff;
}

.editable-amount {
  display: flex;
  align-items: center;
  font-size: 1.2em;
  font-weight: bold;
}

.editable-amount input {
  width: 100px;
  padding: 5px;
  font-size: 1em;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-left: 5px;
  transition: border-color 0.3s;
}

.editable-amount input:focus {
  border-color: #007bff;
  outline: none;
}

.number-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.number-pad button {
  padding: 15px;
  font-size: 1.2em;
  border: 1px solid #ddd;
  background-color: #ffffff;
  cursor: pointer;
  border-radius: 4px;
  transition:
    background-color 0.3s,
    transform 0.2s;
}

.number-pad button:hover {
  background-color: #f0f0f0;
}

.number-pad button:active {
  transform: scale(0.95);
}

.employee-count {
  width: 100%;
  padding: 10px;
  font-size: 1.2em;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.payment-methods .method-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.payment-methods button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background-color: #ffffff;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1em;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.payment-methods button.active {
  background-color: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.payment-methods button:hover {
  background-color: #f0f0f0;
}

.payment-amount input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 1em;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.payment-amount button {
  width: 100%;
  padding: 10px;
  font-size: 1em;
  font-weight: bold;
  background-color: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition:
    background-color 0.3s,
    transform 0.2s;
}

.payment-amount button:hover {
  background-color: #0056b3;
}

.payment-amount button:active {
  transform: scale(0.98);
}

.payments-list {
  margin-top: 20px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.payment-item span {
  font-size: 1em;
}

.payment-item .remove-button {
  padding: 5px 10px;
  font-size: 0.9em;
  background-color: #dc3545;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.payment-item .remove-button:hover {
  background-color: #c82333;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.back-button,
.pay-button,
.generate-receipt-button {
  padding: 10px;
  font-size: 1em;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button {
  background-color: #6c757d;
}

.back-button:hover {
  background-color: #5a6268;
}

.pay-button {
  background-color: #28a745;
}

.pay-button:hover {
  background-color: #218838;
}

.generate-receipt-button {
  background-color: #17a2b8;
}

.generate-receipt-button:hover {
  background-color: #138496;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
