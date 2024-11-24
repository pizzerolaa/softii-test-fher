import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import PDFDocument from 'pdfkit'
import { Buffer } from 'buffer'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

interface Payment {
  method: string
  amount: number
}

interface Tip {
  id: string
  amount: number
  date: string
  payments: Payment[]
  totalEmployees: number
}

interface ReceiptData {
  totalTip: number
  totalEmployees: number
  tipPerPerson: number
  payments: Payment[]
  date: string
}

interface Payment {
  method: string
  amount: number
}

const tips: Tip[] = []

app.post('/api/tips', (req, res) => {
  //aqui es donde se crea una nueva propina y la guardamos en el arreglo de propinas
  const { amount, payments, totalEmployees } = req.body

  const newTip: Tip = {
    id: uuidv4(),
    amount,
    date: new Date().toISOString(),
    payments,
    totalEmployees,
  }

  tips.push(newTip)
  res.status(201).json(newTip)
  console.log('Ingresada nueva propina', newTip)
})

app.post('/api/generate-receipt', (req, res) => {
  //aqui se genera el recibo de pago de propinas en formato pdf
  const { totalTip, totalEmployees, tipPerPerson, payments, date }: ReceiptData = req.body

  const doc = new PDFDocument()
  const buffers: Buffer[] = []
  doc.on('data', (chunk: Buffer) => buffers.push(chunk))
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers)
    res
      .writeHead(200, {
        'Content-Length': Buffer.byteLength(pdfData),
        'Content-Type': 'application/pdf',
        'Content-disposition': 'attachment;filename=recibo-propinas.pdf',
      })
      .end(pdfData)
  })

  //aqui se genera el pdf con la informacion del pago de propinas
  doc.fontSize(18).text('Recibo de Pago de Propinas', { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Fecha: ${new Date(date).toLocaleString()}`)
  doc.text(`Monto Total de Propinas: $${totalTip.toFixed(2)}`)
  doc.text(`Número de Empleados: ${totalEmployees}`)
  doc.text(`Monto por Empleado: $${tipPerPerson.toFixed(2)}`)
  doc.moveDown()
  doc.text('Desglose de Pagos:')
  payments.forEach((payment: Payment) => {
    doc.text(`  ${payment.method}: $${payment.amount.toFixed(2)}`)
  })

  doc.end()
})

app.get('/api/tips', (req, res) => {
  //aqui se obtienen todas las propinas
  res.json(tips)
})

app.get('/api/tips/:id', (req, res) => {
  //aqui se obtiene una propina en especifico
  const { id } = req.params
  const tip = tips.find((tip) => tip.id === id)

  if (tip) {
    res.json(tip)
    console.log('Propina encontrada', tip)
  } else {
    res.status(404).json({ message: 'Propina no encontrada' })
  }
})

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`)
})
