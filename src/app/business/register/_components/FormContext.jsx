"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";

const FormContext = createContext();

const initialState = {
  businessInfo: {},
  contactDetails: {},
  location: {
    location: "",
    coordinates: "",
    city: "",
    state: "",
    zipCode: "",
  },
  classTypes: {},
};

function formReducer(state, action) {
  switch (action.type) {
    case "INITIALIZE_FORM":
      const loadedState = action.payload || initialState;
      if (loadedState.businessInfo?.businessImage) {
        const img = loadedState.businessInfo.businessImage;
        // Check if it looks like a File-like object but isn't a true File instance.
        if (img.name && img.type && !(img instanceof File)) {
          try {
            // Reconstruct the File object. This assumes the data is stored in a way
            // that the `idb` library can handle, often as a Blob-like structure.
            loadedState.businessInfo.businessImage = new File([img], img.name, {
              type: img.type,
              lastModified: img.lastModified,
            });
          } catch (e) {
            console.error("Could not reconstruct file from IndexedDB:", e);
            // If reconstruction fails, nullify it to prevent errors downstream.
            delete loadedState.businessInfo.businessImage;
          }
        }
      }
      return loadedState;
    case "UPDATE_STEP":
      if (initialState.hasOwnProperty(action.stepId)) {
        return {
          ...state,
          [action.stepId]: {
            ...(state[action.stepId] || {}),
            ...action.data,
          },
        };
      }
      console.warn(
        `FormReducer: Attempted to update non-existent stepId "${action.stepId}".`
      );
      return state;
    case "RESET_FORM":
      // Only call deleteFormState on client
      if (
        typeof window !== "undefined" &&
        window.__idbFunctions?.deleteFormState
      ) {
        window.__idbFunctions.deleteFormState();
      }
      return initialState;
    default:
      return state;
  }
}

export function FormProvider({ children }) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") {
      setIsInitialized(true);
      return;
    }

    const initializeState = async () => {
      try {
        // Dynamically import IDB functions only on client
        if (!window.__idbFunctions) {
          const idb = await import("@/services/idb");
          window.__idbFunctions = {
            saveFormState: idb.saveFormState,
            loadFormState: idb.loadFormState,
            deleteFormState: idb.deleteFormState,
          };
        }

        const storedState = await window.__idbFunctions.loadFormState();
        if (storedState && storedState.data) {
          dispatch({ type: "INITIALIZE_FORM", payload: storedState.data });
        }
      } catch (error) {
        console.error("Failed to load form state:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeState();
  }, []);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;

    const timeoutId = setTimeout(async () => {
      try {
        if (window.__idbFunctions?.saveFormState) {
          await window.__idbFunctions.saveFormState({
            data: state,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error("Could not save state to IndexedDB", err);
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [state, isInitialized]);

  const updateStepData = (stepId, data) => {
    dispatch({ type: "UPDATE_STEP", stepId, data });
  };

  const resetForm = () => {
    dispatch({ type: "RESET_FORM" });
  };

  const value = {
    formData: state,
    updateStepData,
    resetForm,
  };

  return (
    <FormContext.Provider value={value}>
      {isInitialized ? children : null}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useForm must be used within a FormProvider");
  }
  return context;
}

export const formRules = {
  required: { required: true, message: "This field is required" },
  email: { type: "email", message: "Please enter a valid email address" },
  phone: {
    pattern: /^[\d\s().+-xX]{7,25}$/,
    message: "Please enter a valid phone number",
  },
  minLength: (min) => ({ min, message: `Must be at least ${min} characters` }),
  maxLength: (max) => ({ max, message: `Cannot exceed ${max} characters` }),
};

export default FormContext;
