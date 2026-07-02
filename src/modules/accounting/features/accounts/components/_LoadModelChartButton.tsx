'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ListTree, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { loadModelChartOfAccounts } from '../actions.server';

interface LoadModelChartButtonProps {
  companyId: string;
}

/**
 * Botón para cargar el Plan de Cuentas Modelo (Ticket #382).
 * Solo se muestra cuando la empresa no tiene cuentas; la acción también lo valida
 * en el servidor.
 */
export function _LoadModelChartButton({ companyId }: LoadModelChartButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await loadModelChartOfAccounts(companyId);
      toast.success(`Plan de cuentas modelo cargado: ${result.created} cuentas creadas`);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar el plan modelo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListTree className="mr-2 h-4 w-4" />
          Cargar Plan Modelo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cargar Plan de Cuentas Modelo</AlertDialogTitle>
          <AlertDialogDescription>
            Se creará un plan de cuentas completo predefinido (Activo, Pasivo, Patrimonio Neto e
            Ingresos/Gastos) con su estructura jerárquica y las cuentas imputables listas para usar.
            Podrás editarlo o ampliarlo después. Esta opción solo está disponible mientras la empresa
            no tenga cuentas cargadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cargar plan modelo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
