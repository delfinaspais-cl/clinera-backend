'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Clock,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PaymentDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clinicaUrl: string
  ventaId: string
  montoTotal: number
  montoAbonado?: number
  montoPendiente?: number
  estadoPago: string
}

interface PaymentDetails {
  montoTotal: number
  montoAbonado: number
  montoPendiente: number
  pagos: any[]
  ultimoPago?: any
  porcentajePagado?: number
  porcentajePendiente?: number
}

export function PaymentDetailsModal({ 
  open, 
  onOpenChange, 
  clinicaUrl, 
  ventaId, 
  montoTotal, 
  montoAbonado,
  montoPendiente,
  estadoPago 
}: PaymentDetailsModalProps) {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Debug logs for props received
  console.log('🔍 DEBUG - PaymentDetailsModal props received:')
  console.log('  - montoTotal:', montoTotal)
  console.log('  - montoAbonado:', montoAbonado)
  console.log('  - montoPendiente:', montoPendiente)
  console.log('  - estadoPago:', estadoPago)

  useEffect(() => {
    if (open && ventaId) {
      console.log('🔍 DEBUG - Modal opened, loading payment details for ventaId:', ventaId)
      loadPaymentDetails()
    }
  }, [open, ventaId])

  const loadPaymentDetails = async () => {
    try {
      console.log('🔍 DEBUG - loadPaymentDetails called')
      setIsLoading(true)
      
      // Debug para verificar la URL
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/turnos/${ventaId}`
      console.log('🔍 DEBUG - API URL:', apiUrl)
      console.log('🔍 DEBUG - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
      
      // Usar el endpoint modificado que procesa los datos correctamente
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        const turnoData = result.data;
        
        console.log('🔍 DEBUG - Turno data from API:', turnoData);
        
        const finalPaymentDetails = {
          montoTotal: turnoData.montoTotal,
          montoAbonado: turnoData.montoAbonado,
          montoPendiente: turnoData.montoPendiente,
          pagos: [], // Por ahora no hay pagos separados
          ultimoPago: null,
          porcentajePagado: turnoData.porcentajePagado,
          porcentajePendiente: turnoData.porcentajePendiente
        };
        
        console.log('🔍 DEBUG - Final paymentDetails from API:', finalPaymentDetails);
        setPaymentDetails(finalPaymentDetails);
      } else {
        throw new Error('Error obteniendo detalles de pago');
      }
    } catch (error) {
      console.error('❌ Error cargando detalles de pago:', error);
      
      // Fallback a los valores de props si la API falla
      const finalPaymentDetails = {
        montoTotal,
        montoAbonado: montoAbonado !== undefined ? montoAbonado : 0,
        montoPendiente: montoPendiente !== undefined ? montoPendiente : montoTotal,
        pagos: [],
        ultimoPago: undefined,
        porcentajePagado: montoTotal > 0 ? Math.round(((montoAbonado || 0) / montoTotal) * 100) : 0,
        porcentajePendiente: montoTotal > 0 ? Math.round(((montoPendiente || montoTotal) / montoTotal) * 100) : 0
      };
      setPaymentDetails(finalPaymentDetails);
      
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de pago desde el servidor",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodIcon = (metodo: string) => {
    switch (metodo) {
      case 'tarjeta':
        return <CreditCard className="w-4 h-4" />
      case 'efectivo':
        return <DollarSign className="w-4 h-4" />
      case 'transferencia':
        return <CreditCard className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  const getPaymentMethodLabel = (metodo: string) => {
    switch (metodo) {
      case 'tarjeta':
        return 'Tarjeta'
      case 'efectivo':
        return 'Efectivo'
      case 'transferencia':
        return 'Transferencia'
      case 'online':
        return 'Online'
      default:
        return metodo
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Detalles del Pago
          </DialogTitle>
          <DialogDescription>
            Información detallada sobre los pagos realizados y pendientes
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando detalles...</span>
          </div>
        ) : paymentDetails ? (
          <>
            {console.log('🔍 DEBUG - UI rendering with paymentDetails:', paymentDetails)}
            <div className="space-y-6">
              {/* Resumen de montos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Pagos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(paymentDetails.montoTotal)}
                      </div>
                      <div className="text-sm text-gray-600">Monto Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(paymentDetails.montoAbonado)}
                      </div>
                      <div className="text-sm text-gray-600">Abonado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(paymentDetails.montoPendiente)}
                      </div>
                      <div className="text-sm text-gray-600">Pendiente</div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${paymentDetails.porcentajePagado || 0}%` 
                      }}
                    ></div>
                  </div>

                  <div className="text-center text-sm text-gray-600">
                    {paymentDetails.porcentajePagado || 0}% pagado
                  </div>
                </CardContent>
              </Card>

              {/* Último pago - Solo mostrar si hay pagos */}
              {paymentDetails.ultimoPago && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Último Pago Realizado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(paymentDetails.ultimoPago.metodo)}
                        <div>
                          <div className="font-medium">
                            {getPaymentMethodLabel(paymentDetails.ultimoPago.metodo)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(paymentDetails.ultimoPago.fechaPago)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(paymentDetails.ultimoPago.monto)}
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Completado
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historial de pagos - Solo mostrar si hay pagos */}
              {paymentDetails.pagos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historial de Pagos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentDetails.pagos
                        .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime())
                        .map((pago) => (
                          <div key={pago.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getPaymentMethodIcon(pago.metodo)}
                              <div>
                                <div className="font-medium">
                                  {getPaymentMethodLabel(pago.metodo)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatDate(pago.fechaPago)}
                                </div>
                                {pago.referencia && (
                                  <div className="text-xs text-gray-500">
                                    Ref: {pago.referencia}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {formatCurrency(pago.monto)}
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={
                                  pago.estado === 'completado' 
                                    ? 'bg-green-100 text-green-800'
                                    : pago.estado === 'pendiente'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {pago.estado === 'completado' ? 'Completado' : 
                                 pago.estado === 'pendiente' ? 'Pendiente' : 
                                 pago.estado === 'fallido' ? 'Fallido' : 
                                 pago.estado === 'reembolsado' ? 'Reembolsado' : pago.estado}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Estado Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Estado del Pago</div>
                      <div className="text-sm text-gray-600">
                        {estadoPago === 'parcial' ? 'Pago Parcial' : 
                         estadoPago === 'pagado' ? 'Pago Completo' : 
                         estadoPago === 'pendiente' ? 'Pendiente de Pago' : estadoPago}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={
                        estadoPago === 'pagado' 
                          ? 'bg-green-100 text-green-800'
                          : estadoPago === 'parcial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {estadoPago ? estadoPago.charAt(0).toUpperCase() + estadoPago.slice(1) : 'N/A'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se pudieron cargar los detalles del pago</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
