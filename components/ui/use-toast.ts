"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

// --- Configuración Global ---
const TOAST_LIMIT = 1 // Número máximo de toasts visibles a la vez
const TOAST_REMOVE_DELAY = 1000000 // Tiempo antes de que el toast sea removido del DOM después de ser Dismissed (casi nunca expira automáticamente)

// --- Tipos ---

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

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

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Declaramos 'dispatch' antes de que sea usado por 'addToRemoveQueue'
let dispatch: (action: Action) => void

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    // Utilizamos el 'dispatch' inicializado globalmente
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// --- Reducer ---

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

      // Side effects: agrega el/los toast(s) a la cola para su eliminación
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          // Si coincide el ID o no se proporciona ID (dismiss all)
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false, // Establece 'open: false' para iniciar la animación de salida
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
  memoryState = reducer(memoryState, action)
  // Notifica a todos los listeners (los setState de los componentes)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// --- Función para crear un Toast ---

type Toast = Omit<ToasterToast, "id">

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
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

// --- Hook de React ---

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
    // 🚨 CORRECCIÓN CLAVE: Dependencia vacía []. 
    // Esto asegura que la suscripción y desuscripción solo ocurran al montar y desmontar,
    // previniendo el bucle infinito causado por la dependencia '[state]' anterior.
  }, []) 

  return {
    ...state,
    toast,
    // Proporciona una forma de llamar al dismiss desde el hook
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }