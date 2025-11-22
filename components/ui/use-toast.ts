"use client"

import * as React from "react"

// Importa los tipos de componentes de tu librería de UI (ej. Shadcn UI)
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast" 

// --- Configuración Global ---
// Número máximo de toasts visibles a la vez
const TOAST_LIMIT = 1 
// Tiempo antes de que el toast sea removido del DOM después de ser Dismissed
// Se pone un valor alto para permitir que la animación de salida se complete
const TOAST_REMOVE_DELAY = 1000000 

// --- Tipos de Toast para el Estado Global ---

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// --- Tipos de Acciones del Reducer ---

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

// --- Utilidades ---

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Declaramos 'dispatch' antes de que sea usado por 'addToRemoveQueue'
let dispatch: (action: Action) => void

/**
 * Agrega un toast a la cola de eliminación (programando un timeout).
 * Esto ocurre después de que el toast ha sido Dismissed (open: false).
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    // Llama al 'dispatch' global para remover el toast del DOM
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// --- Reducer (Lógica de Transición de Estado) ---

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        // Limita el número de toasts visibles al TOAST_LIMIT
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // 1. Side effects: agrega el/los toast(s) a la cola para su eliminación
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        // Dismiss All
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      // 2. Transición de estado: establece 'open: false' para iniciar la animación de salida
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          // Si coincide el ID o no se proporciona ID (dismiss all)
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false, 
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // REMOVE ALL
        return {
          ...state,
          toasts: [],
        }
      }
      // REMOVE ONE
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// --- Gestión de Estado Global (Pub/Sub) ---

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

// Inicialización de la función de despacho (modificando la variable global)
dispatch = function (action: Action) {
  // 1. Actualiza el estado global usando el reducer
  memoryState = reducer(memoryState, action)
  
  // 2. Notifica a todos los listeners (los setState de los hooks 'useToast')
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// --- Función para crear un Toast ---

type Toast = Omit<ToasterToast, "id">

/**
 * Función principal para mostrar un toast.
 * @param props Opciones del toast (title, description, etc.)
 * @returns { id, dismiss, update } Funciones de control.
 */
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: Partial<ToasterToast>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      // Enlaza el evento de cierre del componente de Toast al dispatcher
      onOpenChange: (open) => {
        if (!open) dismiss() // Si el componente se cierra (ej. por swipe o timeout interno), se dispara el DISMISS
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

// --- Hook de React para la Suscripción ---

function useToast() {
  // Inicializa el estado local con el estado global actual
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    // Suscribe la función de actualización de estado local (setState) a los listeners globales
    listeners.push(setState)
    
    // Función de limpieza: desuscribe el setState al desmontar el componente
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
    // La dependencia vacía [] asegura que la suscripción y desuscripción solo ocurran 
    // al montar y desmontar, previniendo el bucle de renderizado.
  }, []) 

  return {
    ...state,
    toast,
    // Proporciona una forma de llamar al dismiss desde el hook
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }