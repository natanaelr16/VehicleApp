import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  InspectionForm, 
  VehicleInfo, 
  VehicleHistory,
  InspectionItem, 
  PhotoData, 
  InspectionPhoto,
  AppSettings,
  ReportTemplate,
  BodyInspection,
  TireInspection
} from '../types';

interface AppState {
  // Estado actual
  currentInspection: InspectionForm | null;
  currentPhotos: PhotoData[];
  settings: AppSettings;
  savedInspections: InspectionForm[];
  templates: ReportTemplate[];
  
  // Acciones
  setCurrentInspection: (inspection: InspectionForm | null) => void;
  updateVehicleInfo: (vehicleInfo: Partial<VehicleInfo>) => void;
  updateVehicleHistory: (vehicleHistory: Partial<VehicleHistory>) => void;
  addInspectionItem: (item: InspectionItem) => void;
  updateInspectionItem: (itemId: string, updates: Partial<InspectionItem>) => void;
  removeInspectionItem: (itemId: string) => void;
  addPhoto: (photo: PhotoData) => void;
  removePhoto: (photoId: string) => void;
  updateBodyInspection: (bodyInspection: BodyInspection) => void;
  updateTireInspection: (tireInspection: TireInspection) => void;
  addInspectionPhoto: (photo: InspectionPhoto) => void;
  removeInspectionPhoto: (photoId: string) => void;
  updateInspectionPhoto: (photoId: string, updates: Partial<InspectionPhoto>) => void;
  saveInspection: () => void;
  loadInspection: (inspectionId: string) => void;
  deleteInspection: (inspectionId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addTemplate: (template: ReportTemplate) => void;
  removeTemplate: (templateId: string) => void;
  clearCurrentInspection: () => void;
  updateFechaIngreso: (fechaIngreso: string) => void;
  updateHoraIngreso: (horaIngreso: string) => void;
  updateSugerenciasDiagnostico: (sugerencias: string[]) => void;
  updatePrecioSugerido: (precio: string) => void;
  updateResultadoInspeccion: (resultado: 'approved' | 'rejected') => void;
}

const defaultSettings: AppSettings = {
  companyName: 'Mi Empresa',
  inspectorName: '',
  defaultNotes: [
    'En buen estado',
    'Requiere mantenimiento',
    'Necesita reparación',
    'No aplica'
  ],
  autoSave: true,
  photoQuality: 'medium'
};

const defaultTemplate: ReportTemplate = {
  id: 'default',
  name: 'Inspección General',
  isDefault: true,
  items: [
    { id: '1', category: 'Motor', item: 'Aceite del motor', status: 'good' },
    { id: '2', category: 'Motor', item: 'Filtro de aire', status: 'good' },
    { id: '3', category: 'Motor', item: 'Batería', status: 'good' },
    { id: '4', category: 'Frenos', item: 'Pastillas de freno', status: 'good' },
    { id: '5', category: 'Frenos', item: 'Líquido de frenos', status: 'good' },
    { id: '6', category: 'Suspensión', item: 'Amortiguadores', status: 'good' },
    { id: '7', category: 'Suspensión', item: 'Resortes', status: 'good' },
    { id: '8', category: 'Neumáticos', item: 'Presión de neumáticos', status: 'good' },
    { id: '9', category: 'Neumáticos', item: 'Desgaste de neumáticos', status: 'good' },
    { id: '10', category: 'Iluminación', item: 'Luces delanteras', status: 'good' },
    { id: '11', category: 'Iluminación', item: 'Luces traseras', status: 'good' },
    { id: '12', category: 'Iluminación', item: 'Direccionales', status: 'good' },
  ]
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentInspection: null,
      currentPhotos: [],
      settings: defaultSettings,
      savedInspections: [],
      templates: [defaultTemplate],

      // Acciones
      setCurrentInspection: (inspection) => set({ currentInspection: inspection }),
      
      updateVehicleInfo: (vehicleInfo) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              vehicleInfo: { ...currentInspection.vehicleInfo, ...vehicleInfo }
            }
          });
        }
      },

      updateVehicleHistory: (vehicleHistory) => {
        const { currentInspection } = get();
        if (currentInspection) {
          console.log('AppStore - updateVehicleHistory called with:', vehicleHistory);
          
          set({
            currentInspection: {
              ...currentInspection,
              vehicleHistory: {
                ...currentInspection.vehicleHistory,
                ...vehicleHistory
              } as VehicleHistory
            }
          });
          console.log('AppStore - vehicleHistory updated successfully');
        }
      },

      addInspectionItem: (item) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              items: [item, ...currentInspection.items]
            }
          });
        }
      },

      updateInspectionItem: (itemId, updates) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              items: currentInspection.items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            }
          });
        }
      },

      removeInspectionItem: (itemId) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              items: currentInspection.items.filter(item => item.id !== itemId)
            }
          });
        }
      },

      addPhoto: (photo) => {
        set({ currentPhotos: [...get().currentPhotos, photo] });
      },

      removePhoto: (photoId) => {
        set({ 
          currentPhotos: get().currentPhotos.filter(photo => photo.id !== photoId) 
        });
      },

      updateBodyInspection: (bodyInspection) => {
        console.log('AppStore - updateBodyInspection called with:', bodyInspection);
        console.log('AppStore - capturedImage type:', typeof bodyInspection.capturedImage);
        console.log('AppStore - capturedImage length:', bodyInspection.capturedImage?.length);
        console.log('AppStore - capturedImage preview:', bodyInspection.capturedImage?.substring(0, 100));
        
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              bodyInspection
            }
          });
          console.log('AppStore - bodyInspection updated successfully');
          
          // Verificar que se guardó correctamente
          setTimeout(() => {
            const newState = get();
            console.log('AppStore - currentInspection después de updateBodyInspection:', newState.currentInspection);
            console.log('AppStore - bodyInspection después de updateBodyInspection:', newState.currentInspection?.bodyInspection);
            console.log('AppStore - capturedImage después de updateBodyInspection:', newState.currentInspection?.bodyInspection?.capturedImage?.substring(0, 100));
          }, 100);
        } else {
          console.log('AppStore - No currentInspection to update');
        }
      },

      updateTireInspection: (tireInspection) => {
        console.log('AppStore - updateTireInspection called with:', tireInspection);
        const { currentInspection } = get();
        if (currentInspection) {
          const updatedInspection = {
            ...currentInspection,
            tireInspection
          };
          console.log('AppStore - updatedInspection a guardar:', updatedInspection);
          
          set({
            currentInspection: updatedInspection
          });
          
          // Verificar que se guardó correctamente
          setTimeout(() => {
            const newState = get();
            console.log('AppStore - currentInspection después de updateTireInspection:', newState.currentInspection);
            console.log('AppStore - tireInspection después de updateTireInspection:', newState.currentInspection?.tireInspection);
          }, 100);
          
          console.log('AppStore - tireInspection updated successfully');
        } else {
          console.log('AppStore - No currentInspection to update');
        }
      },

      addInspectionPhoto: (photo) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              inspectionPhotos: [...(currentInspection.inspectionPhotos || []), photo]
            }
          });
        }
      },

      removeInspectionPhoto: (photoId) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              inspectionPhotos: (currentInspection.inspectionPhotos || []).filter(photo => photo.id !== photoId)
            }
          });
        }
      },

      updateInspectionPhoto: (photoId, updates) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              inspectionPhotos: (currentInspection.inspectionPhotos || []).map(photo =>
                photo.id === photoId ? { ...photo, ...updates } : photo
              )
            }
          });
        }
      },

      saveInspection: () => {
        const { currentInspection, savedInspections } = get();
        if (currentInspection) {
          const existingIndex = savedInspections.findIndex(
            inspection => inspection.id === currentInspection.id
          );
          
          if (existingIndex >= 0) {
            // Actualizar inspección existente
            const updatedInspections = [...savedInspections];
            updatedInspections[existingIndex] = currentInspection;
            set({ savedInspections: updatedInspections });
          } else {
            // Agregar nueva inspección
            set({ 
              savedInspections: [...savedInspections, currentInspection] 
            });
          }
        }
      },

      loadInspection: (inspectionId) => {
        const { savedInspections } = get();
        const inspection = savedInspections.find(
          inspection => inspection.id === inspectionId
        );
        if (inspection) {
          // Convertir la fecha de vuelta a objeto Date si es string
          const inspectionWithDate = {
            ...inspection,
            inspectionDate: inspection.inspectionDate instanceof Date 
              ? inspection.inspectionDate 
              : new Date(inspection.inspectionDate),
            // Convertir timestamps de fotos de inspección
            inspectionPhotos: inspection.inspectionPhotos?.map(photo => ({
              ...photo,
              timestamp: photo.timestamp instanceof Date 
                ? photo.timestamp 
                : photo.timestamp && typeof photo.timestamp === 'string' 
                  ? new Date(photo.timestamp) 
                  : new Date()
            })) || []
          };
          set({ currentInspection: inspectionWithDate });
        }
      },

      deleteInspection: (inspectionId) => {
        set({
          savedInspections: get().savedInspections.filter(
            inspection => inspection.id !== inspectionId
          )
        });
      },

      updateSettings: (settings) => {
        set({ settings: { ...get().settings, ...settings } });
      },

      addTemplate: (template) => {
        set({ templates: [...get().templates, template] });
      },

      removeTemplate: (templateId) => {
        set({
          templates: get().templates.filter(template => template.id !== templateId)
        });
      },

      clearCurrentInspection: () => {
        set({ currentInspection: null, currentPhotos: [] });
      },

      updateFechaIngreso: (fechaIngreso) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              fechaIngreso
            }
          });
        }
      },
      updateHoraIngreso: (horaIngreso) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              horaIngreso
            }
          });
        }
      },
      updateSugerenciasDiagnostico: (sugerencias) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              sugerenciasDiagnostico: sugerencias
            }
          });
        }
      },
      updatePrecioSugerido: (precio) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              precioSugerido: precio
            }
          });
        }
      },
      updateResultadoInspeccion: (resultado) => {
        const { currentInspection } = get();
        if (currentInspection) {
          set({
            currentInspection: {
              ...currentInspection,
              resultadoInspeccion: resultado
            }
          });
        }
      },
    }),
    {
      name: 'vehicle-inspection-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        savedInspections: state.savedInspections,
        templates: state.templates,
        currentInspection: state.currentInspection,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convertir fechas de vuelta a objetos Date después de cargar desde storage
          if (state.savedInspections) {
            state.savedInspections = state.savedInspections.map(inspection => ({
              ...inspection,
              inspectionDate: inspection.inspectionDate instanceof Date 
                ? inspection.inspectionDate 
                : new Date(inspection.inspectionDate),
              // Convertir timestamps de fotos de inspección
              inspectionPhotos: inspection.inspectionPhotos?.map(photo => ({
                ...photo,
                timestamp: photo.timestamp instanceof Date 
                  ? photo.timestamp 
                  : photo.timestamp && typeof photo.timestamp === 'string' 
                    ? new Date(photo.timestamp) 
                    : new Date()
              })) || []
            }));
          }
          
          // Convertir fecha de currentInspection si existe
          if (state.currentInspection) {
            state.currentInspection = {
              ...state.currentInspection,
              inspectionDate: state.currentInspection.inspectionDate instanceof Date 
                ? state.currentInspection.inspectionDate 
                : new Date(state.currentInspection.inspectionDate),
              // Convertir timestamps de fotos de inspección
              inspectionPhotos: state.currentInspection.inspectionPhotos?.map(photo => ({
                ...photo,
                timestamp: photo.timestamp instanceof Date 
                  ? photo.timestamp 
                  : photo.timestamp && typeof photo.timestamp === 'string' 
                    ? new Date(photo.timestamp) 
                    : new Date()
              })) || []
            };
          }
        }
      },
    }
  )
); 