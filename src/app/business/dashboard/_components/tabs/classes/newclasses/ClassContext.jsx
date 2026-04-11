"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
} from "react";
import debounce from "lodash/debounce";

const ClassContext = createContext();

const defaultInitialState = {
  basicInfo: {
    title: "",
    description: "",
    features: [],
    images: [],
  },
  locationContact: {
    location: "",
    unit_number: "",
    searchValue: "",
    coordinates: "0, 0",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    location_ref: null,
    saltLocation: false,
    studentContactEmail: "",
    studentContactPhone: "",
    adminContactEmail: "",
    adminContactPhone: "",
  },
  // MULTI-TIER UPDATE: Initialize as array with Primary tier
  options: [
    {
      id: Date.now() + Math.random(),
      title: "General Admission",
      schedule_mode: "primary",
      booking_type: "Single Session",
      equipment: "",
      tags: [],
    },
  ],
  active: true,
};

const actionTypes = {
  SET_INITIAL_STATE: "SET_INITIAL_STATE",
  UPDATE_BASIC_INFO: "UPDATE_BASIC_INFO",
  UPDATE_LOCATION_CONTACT: "UPDATE_LOCATION_CONTACT",
  UPDATE_OPTIONS: "UPDATE_OPTIONS",
  RESET_FORM: "RESET_FORM",
};

// This function will hold our client-side storage logic
const idbFunctions = {
  saveFormState: () => Promise.resolve(),
  loadFormState: () => Promise.resolve(null),
  deleteFormState: () => Promise.resolve(),
};

const classReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_INITIAL_STATE:
      return action.payload;
    case actionTypes.UPDATE_BASIC_INFO:
      return {
        ...state,
        basicInfo: { ...state.basicInfo, ...action.payload },
      };
    case actionTypes.UPDATE_LOCATION_CONTACT:
      return {
        ...state,
        locationContact: { ...state.locationContact, ...action.payload },
      };
    case actionTypes.UPDATE_OPTIONS:
      // MULTI-TIER UPDATE: Handle replacing the entire array of options
      const incomingPayload = Array.isArray(action.payload)
        ? action.payload
        : [];

      // Fallback if payload is empty (should not happen in normal flow)
      const newOptionsData =
        incomingPayload.length > 0
          ? incomingPayload
          : [
              {
                id: Date.now() + Math.random(),
                title: "General Admission",
                schedule_mode: "primary",
                booking_type: "Single Session",
                equipment: "",
                tags: [],
              },
            ];

      // Ensure every option has an internal ID for React keys if not present
      const formattedOptions = newOptionsData.map((opt, index) => ({
        ...opt,
        id: opt.id || opt.optionId || Date.now() + Math.random() + index,
        // Enforce Primary rule on index 0
        schedule_mode: index === 0 ? "primary" : opt.schedule_mode || "synced",
        title: opt.title || (index === 0 ? "General Admission" : ""),
        equipment: Array.isArray(opt.equipment)
          ? opt.equipment.join("\n")
          : (opt.equipment ?? ""),
        tags: opt.tags || [],
      }));

      return {
        ...state,
        options: formattedOptions,
      };

    case actionTypes.RESET_FORM:
      // The side-effect of deleting from storage is handled in the resetForm function
      return defaultInitialState;
    default:
      return state;
  }
};

export const ClassProvider = ({ children }) => {
  const [state, dispatch] = useReducer(classReducer, defaultInitialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect runs ONLY on the client, preventing SSR errors.
    const initializeClientSideLogic = async () => {
      try {
        // Dynamically import IDB functions only on the client
        const idb = await import("@/services/idb");
        idbFunctions.saveFormState = idb.saveFormState;
        idbFunctions.loadFormState = idb.loadFormState;
        idbFunctions.deleteFormState = idb.deleteFormState;

        const persistedStateWithMeta = await idbFunctions.loadFormState();

        if (persistedStateWithMeta && persistedStateWithMeta.data) {
          const persistedState = persistedStateWithMeta.data;
          // Re-create blob URLs for images after loading from storage
          if (
            persistedState.basicInfo &&
            Array.isArray(persistedState.basicInfo.images)
          ) {
            persistedState.basicInfo.images =
              persistedState.basicInfo.images.map((img) => ({
                ...img,
                url:
                  img.file instanceof File
                    ? URL.createObjectURL(img.file)
                    : img.url,
              }));
          }
          dispatch({
            type: actionTypes.SET_INITIAL_STATE,
            payload: persistedState,
          });
        }
      } catch (error) {
        console.error("Failed to load form state from IndexedDB:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    initializeClientSideLogic();
  }, []);

  useEffect(() => {
    // This effect also runs only on the client and after the initial state is loaded.
    if (!isLoaded) return;

    const saveState = async () => {
      try {
        const stateToSave = {
          data: state,
          timestamp: Date.now(),
        };
        await idbFunctions.saveFormState(stateToSave);
      } catch (error) {
        console.error("Failed to save form state to IndexedDB:", error);
      }
    };

    saveState();
  }, [state, isLoaded]);

  const updateBasicInfo = (data) => {
    dispatch({ type: actionTypes.UPDATE_BASIC_INFO, payload: data });
  };
  const debouncedUpdateBasicInfo = useCallback(
    debounce(updateBasicInfo, 500),
    []
  );

  const updateLocationContact = (data) => {
    dispatch({ type: actionTypes.UPDATE_LOCATION_CONTACT, payload: data });
  };
  const debouncedUpdateLocationContact = useCallback(
    debounce(updateLocationContact, 500),
    []
  );

  const updateOptions = (optionsArray) => {
    dispatch({ type: actionTypes.UPDATE_OPTIONS, payload: optionsArray });
  };
  const debouncedUpdateOptions = useCallback(debounce(updateOptions, 500), [
    state.options,
  ]);

  const resetForm = () => {
    // Handle the client-side storage deletion here, which is safe.
    idbFunctions.deleteFormState();
    dispatch({ type: actionTypes.RESET_FORM });
  };

  const value = {
    state,
    isLoaded,
    updateBasicInfo,
    debouncedUpdateBasicInfo,
    updateLocationContact,
    debouncedUpdateLocationContact,
    updateOptions,
    debouncedUpdateOptions,
    resetForm,
  };

  return (
    <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClass must be used within a ClassProvider");
  }
  return context;
};

export default ClassContext;
