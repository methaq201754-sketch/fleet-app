import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert,
  Modal, SafeAreaView, StatusBar, Switch, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { createClient } from '@supabase/supabase-js';

// Supabase Integration Setup & Keys
const SUPABASE_URL = "https://zsxndqxhgirwrtmhsngx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzeG5kcXhoZ2lyd3J0bWhzbmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MjIxMjksImV4cCI6MjEwNzI5ODEyOX0.g0jM3FppnlUYhVluTpjnK56XUOkIeWvpO4cl_I_Um1k";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

const APP_VERSION = '1.87.57';
const APP_BUILD = '87';
const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F4F7FB', card: '#FFFFFF', text: '#263238', muted: '#718096',
  border: '#E2E8F0', success: '#2E7D32', warning: '#ED8B00', danger: '#C62828',
};

type Vehicle = {
  id: string; carNumber: string; name: string; driver: string; status: string; type: string;
  model: string; payload: string; fuelType: string; engineNo: string; chassisNo: string;
  ownership?: 'شركة' | 'خاصة';
  directManager?: string;
  directManagerId?: string;
};

type RequestItem = {
  id: string; vehicleId: string; driver: string; type: string; date: string;
  qty: number; total: number; status: string; notes?: string; imageUri?: string;
  station?: string; fuelType?: string; unit?: string; oilType?: string;
  itemName?: string; prevOdo?: number; currOdo?: number; distance?: number;
  workshop?: string; engineer?: string; faultType?: string; requiredWork?: string;
  client?: string; serviceDescription?: string; workflow?: string; approvalTrail?: string[];
  startDate?: string; endDate?: string; returnDate?: string; daysCount?: number;
  destination?: string; custody?: number;
  directManagerStatus?: string;
  servicesStatus?: string;
  applicantId?: string;
};

type PermissionSet = {
  addVehicle: boolean; editVehicle: boolean; assignVehicle: boolean;
  changePassword: boolean; reports: boolean; requestService: boolean;
  fuel: boolean; oils: boolean; batteries: boolean; parts: boolean;
  maintenance: boolean; tires: boolean; addDriver: boolean; editDriver: boolean;
  editCodings: boolean; editPrices: boolean;
};

type Assignment = {
  id: string; driver: string; driverId: string; vehicleId: string;
  startDate: string; endDate: string; notes: string;
};

const DEFAULT_PERMISSIONS: PermissionSet = {
  addVehicle: true, editVehicle: false, assignVehicle: false, changePassword: true,
  reports: true, requestService: true, fuel: true, oils: true, batteries: true,
  parts: true, maintenance: true, tires: true, addDriver: false, editDriver: false,
  editCodings: false, editPrices: false,
};

const TODAY = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => `${Number(n || 0).toLocaleString()} ريال`;
const escapeHtml = (s: string) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// حساب ميثاق2 قد يكون اسمه التقني methaq2 في Supabase، وليس الاسم العربي.
const isRequestApprover = (user: any) => {
  const username = String(user?.username || '').trim().toLowerCase().replace(/\s+/g, '');
  const role = String(user?.role || user?.profile?.role || '').trim().toLowerCase();
  const extraRoles = Array.isArray(user?.extraRoles) ? user.extraRoles.map((r: any) => String(r).toLowerCase()) : [];
  return ['ميثاق2', 'ميثاق٢', 'methaq2', 'methaq_2', 'methaq-2'].includes(username) ||
    extraRoles.includes('request_approver') || extraRoles.includes('system_admin');
};

export default function App() {
  const [showFourDotSplash, setShowFourDotSplash] = useState(true);
  useEffect(() => {
    const splashTimer = setTimeout(() => setShowFourDotSplash(false), 1400);
    return () => clearTimeout(splashTimer);
  }, []);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [stations, setStations] = useState<string[]>(['محطة الزبيدي', 'محطة الشركة', 'محطة نقدي']);
  const [fuelTypes, setFuelTypes] = useState<string[]>(['ديزل', 'بترول']);
  const [oils, setOils] = useState<string[]>(['تويوتا', 'ليكوي مولي', 'ناشيونال']);
  const [batteries, setBatteries] = useState<string[]>(['بطارية 70 أمبير', 'بطارية 100 أمبير']);
  const [parts, setParts] = useState<string[]>(['فلتر زيت', 'فلتر هواء', 'فحمات فرامل']);
  const [tires, setTires] = useState<string[]>(['إطار 12.00R20', 'إطار 215/75R17.5']);
  const [maintenanceItems, setMaintenanceItems] = useState<string[]>(['صيانة عامة', 'كهرباء', 'ميكانيكا']);
  const [workshops, setWorkshops] = useState<string[]>(['ورشة المركز الرئيسي', 'ورشة الصناعية']);
  const [clients, setClients] = useState<string[]>(['شركة الألوان', 'الشركة العامة']);
  const [engineers, setEngineers] = useState<string[]>(['مهندس أحمد', 'مهندس محمد']);
  const [prices, setPrices] = useState<Record<string, number>>({
    'ديزل': 1200, 'بترول': 1200, 'تويوتا': 4500, 'ليكوي مولي': 6000,
    'ناشيونال': 4000, 'بطارية 70 أمبير': 65000, 'بطارية 100 أمبير': 85000,
    'فلتر زيت': 8000, 'فلتر هواء': 12000, 'فحمات فرامل': 25000,
    'إطار 12.00R20': 85000, 'إطار 215/75R17.5': 65000,
    'صيانة عامة': 10000, 'كهرباء': 10000, 'ميكانيكا': 10000,
  });
  
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [permissions, setPermissions] = useState<Record<string, PermissionSet>>({});
  
  const [requestManagersTab, setRequestManagersTab] = useState('distribute');
  const [managerProfiles, setManagerProfiles] = useState<any[]>([]);
  const [workflowRoutes, setWorkflowRoutes] = useState<string[]>(['المسؤول المباشر', 'الخدمات الإدارية', 'المسؤول النهائي']);
  const [newRouteName, setNewRouteName] = useState('');
  const [userTab, setUserTab] = useState('service');
  const [adminTab, setAdminTab] = useState('requests');
  const [loadingDb, setLoadingDb] = useState(false);
  
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [savingManager, setSavingManager] = useState(false);
  const [managerAssignModal, setManagerAssignModal] = useState(false);
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState<any>(null);
  const [chosenDirectManager, setChosenDirectManager] = useState('');

  const [tripTypes, setTripTypes] = useState<string[]>(['مهمة عمل','توصيل مواد','مراجعة جهة']);
  const [tripDestinations, setTripDestinations] = useState<string[]>(['صنعاء','عدن','الحديدة','إب','ذمار','رداع']);
  
  const [adminRequestTab, setAdminRequestTab] = useState('وقود');
  const [pricingCategoryModal, setPricingCategoryModal] = useState<string | null>(null);
  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  const [editingDispatchRequest, setEditingDispatchRequest] = useState<RequestItem | null>(null);
  const [dispatchEditForm, setDispatchEditForm] = useState({ workshop: '', engineer: '', faultType: '', faultCause: '', requiredWork: '', spareParts: '', estimatedCost: '', finalCost: '', workshopReport: '', approvalStatus: 'pending', approvalNotes: '', repairStatus: 'pending', repairCompletedAt: '', deliveredTo: '', deliveredAt: '', deliveryNotes: '', client: '', serviceDescription: '', notes: '' });
  const [codingModal, setCodingModal] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  
  const [selectedStation, setSelectedStation] = useState(stations[0]);
  const [selectedFuel, setSelectedFuel] = useState(fuelTypes[0]);
  const [selectedOil, setSelectedOil] = useState(oils[0]);
  const [selectedBattery, setSelectedBattery] = useState(batteries[0]);
  const [selectedPart, setSelectedPart] = useState(parts[0]);
  const [selectedTire, setSelectedTire] = useState(tires[0]);
  const [selectedMaintenance, setSelectedMaintenance] = useState(maintenanceItems[0]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(workshops[0]);
  const [selectedEngineer, setSelectedEngineer] = useState(engineers[0]);
  const [selectedClient, setSelectedClient] = useState(clients[0]);
  const [selectedUnit, setSelectedUnit] = useState('دبة');
  
  const [reqQty, setReqQty] = useState('');
  const [currOdometer, setCurrOdometer] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqImage, setReqImage] = useState<string | undefined>();
  const [faultType, setFaultType] = useState('');
  const [requiredWork, setRequiredWork] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [reportType, setReportType] = useState('الكل');
  
  const [subView, setSubView] = useState<'report' | 'create'>('report');
  const [darkMode, setDarkMode] = useState(false);
  const [ownershipTypes, setOwnershipTypes] = useState<string[]>(['شركة','خاصة']);
  
  const [assignmentSearchCar, setAssignmentSearchCar] = useState('');
  const [assignmentSearchDriver, setAssignmentSearchDriver] = useState('');
  const [assignmentStartDate, setAssignmentStartDate] = useState(TODAY());
  const [assignmentEndDate, setAssignmentEndDate] = useState('');

  const [maintenanceServiceSubModal, setMaintenanceServiceSubModal] = useState<'صيانة' | 'بنشر' | null>(null);

  const codingMap: Record<string, string[]> = {
    'المحروقات': fuelTypes, 'الزيوت': oils, 'البطاريات': batteries, 'قطع الغيار': parts,
    'الإطارات': tires, 'المحطات': stations, 'الصيانة': maintenanceItems,
    'الورش': workshops, 'العملاء': clients, 'المهندسين': engineers, 'مالك السيارة': ownershipTypes,
    'نوع المهمة': tripTypes, 'الوجهة/المنطقة': tripDestinations,
  };
  const codingSetters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
    'المحروقات': setFuelTypes, 'الزيوت': setOils, 'البطاريات': setBatteries,
    'قطع الغيار': setParts, 'الإطارات': setTires, 'المحطات': setStations,
    'الصيانة': setMaintenanceItems, 'الورش': setWorkshops, 'العملاء': setClients,
    'المهندسين': setEngineers, 'مالك السيارة': setOwnershipTypes, 'نوع المهمة': setTripTypes,
    'الوجهة/المنطقة': setTripDestinations,
  };

  const [assignmentForm, setAssignmentForm] = useState<Assignment>({
    id: '', driver: '', driverId: '', vehicleId: '', startDate: TODAY(), endDate: '', notes: '',
  });
  const [driverDropdownVisible, setDriverDropdownVisible] = useState(false);
  const [vehicleDropdownVisible, setVehicleDropdownVisible] = useState(false);
  const [fleetCategory, setFleetCategory] = useState('جميع السيارات');
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleEditId, setVehicleEditId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [driverEditId, setDriverEditId] = useState<number | null>(null);
  const [driverForm, setDriverForm] = useState({ driver_name: '', plate_number: '', phone: '', status: 'active' });
  const [vehicleForm, setVehicleForm] = useState<Vehicle>({
    id: '', carNumber: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
    payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة'
  });

  const parseStoredNotes = (raw: any) => {
    const text = String(raw || '');
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.__fleetApp === true) return parsed;
    } catch (_) {}
    return { __fleetApp: true, appNotes: text, appFields: {} };
  };

  const makeStoredNotes = (item: RequestItem) => JSON.stringify({
    __fleetApp: true,
    appNotes: item.notes || '',
    appFields: {
      fuelType: item.fuelType, oilType: item.oilType, itemName: item.itemName,
      prevOdo: item.prevOdo, currOdo: item.currOdo, distance: item.distance,
      workshop: item.workshop, engineer: item.engineer, faultType: item.faultType,
      requiredWork: item.requiredWork, client: item.client,
      serviceDescription: item.serviceDescription, approvalTrail: item.approvalTrail,
      destination: item.destination, startDate: item.startDate, endDate: item.endDate,
      returnDate: item.returnDate, daysCount: item.daysCount, custody: item.custody,
      imageUri: item.imageUri
    }
  });

  const loadSupabaseData = async () => {
    try {
      setLoadingDb(true);
      const { data: pData, error: pError } = await supabase.from('profiles').select('id, username, full_name, role, phone, is_active');
      if (!pError && pData) setManagerProfiles(pData);
      const profilesForLookup = pData || [];
      const { data: dData, error: dError } = await supabase
        .from('drivers')
        .select('id, driver_name, plate_number, phone, status, created_at')
        .order('driver_name', { ascending: true });
      if (!dError && dData) setDrivers(dData);

      const { data: vData, error: vError } = await supabase.from('vehicles').select('*').order('id', { ascending: true });
      if (vError) throw vError;
      if (vData) {
        const driverRows = dData || [];
        const mappedFleet: Vehicle[] = vData.map((v: any) => {
          const assignedProfile = profilesForLookup.find((p: any) => String(p.id) === String(v.direct_manager_id || ''));
          const carNo = String(v.car_number || '').trim();
          const matchedDriver = driverRows.find((d: any) => String(d.plate_number || '').trim() === carNo);
          return {
            id: String(v.id),
            carNumber: carNo,
            name: v.car_name || `سيارة ${carNo}`,
            driver: matchedDriver?.driver_name || '',
            status: v.status || 'في الخدمة',
            type: v.brand || 'سيارة',
            model: String(v.model || v.manufacturing_year || ''),
            payload: v.load_capacity || '',
            fuelType: v.fuel_type || 'ديزل',
            engineNo: v.engine_number || '',
            chassisNo: v.chassis_number || '',
            ownership: v.ownership === 'خاصة' ? 'خاصة' : 'شركة',
            directManager: v.direct_manager || v.directManager || assignedProfile?.full_name || assignedProfile?.username || '',
            directManagerId: v.direct_manager_id ? String(v.direct_manager_id) : ''
          };
        });
        setFleet(mappedFleet);
      }
      const { data: rData, error: rError } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
      if (!rError && rData) {
        const mappedReqs: RequestItem[] = (rData || []).map((r: any) => {
          const stored = parseStoredNotes(r.notes);
          const extra = stored.appFields || {};
          const stage = r.status === 'مرفوض' ? 'تم رفض الطلب'
            : r.status === 'تمت الموافقة' ? 'تمت الموافقة'
            : (r.direct_manager_status === 'موافق')
              ? ((r.services_status === 'موافق') ? 'المسؤول' : 'الخدمات الإدارية')
              : 'المسؤول المباشر';
          return {
            id: String(r.id), vehicleId: String(r.vehicle_id || ''), driver: r.driver_name || '',
            type: r.service_type || 'خدمة', date: String(r.request_date || r.created_at || TODAY()).slice(0, 10),
            qty: Number(r.quantity || 0), total: Number(r.total || 0), status: r.status || 'تحت المراجعة',
            notes: stored.appNotes || '', station: r.station || '', unit: r.unit || '',
            currOdo: r.odometer == null ? undefined : Number(r.odometer), workflow: stage,
            imageUri: extra.imageUri, fuelType: extra.fuelType, oilType: extra.oilType,
            itemName: extra.itemName, prevOdo: extra.prevOdo, distance: extra.distance,
            workshop: extra.workshop, engineer: extra.engineer, faultType: extra.faultType,
            requiredWork: extra.requiredWork, client: extra.client, serviceDescription: extra.serviceDescription,
            approvalTrail: extra.approvalTrail || [], destination: extra.destination,
            startDate: extra.startDate, endDate: extra.endDate, returnDate: extra.returnDate,
            daysCount: extra.daysCount, custody: extra.custody,
            directManagerStatus: r.direct_manager_status || 'تحت المراجعة',
            servicesStatus: r.services_status || 'تحت المراجعة',
            applicantId: r.applicant_id || ''
          };
        });
        setRequests(mappedReqs);
      }
    } catch (e: any) {
      console.log('Supabase Fetch Error:', e?.message || e);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserProfileAndRestore(session.user);
        await loadSupabaseData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfileAndRestore(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    loadSupabaseData();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfileAndRestore = async (user: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles').select('id, username, full_name, role, phone, is_active')
        .eq('id', user.id).maybeSingle();
      
      if (!profile) return;
      const roleRaw = String(profile.role || '').toLowerCase();
      const isAdmin = ['admin', 'administrator', 'manager', 'services_manager', 'direct_manager', 'request_approver', 'system_admin', 'مسؤول', 'مدير', 'مدير عام', 'مدير الخدمات', 'مسؤول الخدمات'].includes(roleRaw);
      
      if (isAdmin) {
        let extraRoles: string[] = [];
        const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        if (roleRows) extraRoles = roleRows.map((row: any) => String(row.role || '').toLowerCase());
        setCurrentUser({ role: roleRaw === 'admin' ? 'admin' : 'manager', authId: user.id, username: profile.username, name: profile.full_name || profile.username, profile, extraRoles });
      } else {
        const carNumber = String(profile.username || '');
        const { data: vehicle } = await supabase.from('vehicles').select('*').eq('car_number', carNumber).maybeSingle();
        
        const v: Vehicle = {
          id: String(vehicle?.id || ''),
          carNumber: String(vehicle?.car_number || carNumber),
          name: vehicle?.car_name || `سيارة ${carNumber}`,
          driver: profile.full_name || '', 
          status: 'في الخدمة', 
          type: vehicle?.brand || 'سيارة',
          model: String(vehicle?.model || vehicle?.manufacturing_year || ''), 
          payload: vehicle?.load_capacity || '',
          fuelType: vehicle?.fuel_type || 'ديزل', 
          engineNo: vehicle?.engine_number || '', 
          chassisNo: vehicle?.chassis_number || '', 
          ownership: 'شركة'
        };
        setCurrentUser({ role: 'driver', authId: user.id, username: profile.username, id: v.carNumber, ...v, profile });
        setEditDriverName(v.driver);
      }
    } catch (err) {
      console.log('Restore session error:', err);
    }
  };

  const getPermission = (vehicleId: string): PermissionSet =>
    permissions[vehicleId] || DEFAULT_PERMISSIONS;

  const lastOdometer = (vehicleId: string) => {
    const rows = requests.filter(r => r.vehicleId === vehicleId && r.type === 'زيوت' && r.currOdo != null);
    return rows.length ? Number(rows[0].currOdo) || 0 : 0;
  };

  const driverNames = useMemo(
    () => Array.from(new Set(fleet.map(v => v.driver).filter(Boolean))),
    [fleet]
  );

  const assignmentVehicle = fleet.find(v => v.carNumber === assignmentForm.vehicleId.trim());

  const handleLogin = async () => {
    const u = username.trim(), p = password.trim();
    if (!u || !p) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المستخدم أو رقم السيارة وكلمة المرور');
      return;
    }
    try {
      setLoadingDb(true);
      const loginEmails: Record<string, string> = {
        'ميثاق2': 'methaq2@fleet-login.example.com',
        'عبدالله2': 'abdullah2@fleet-login.example.com',
        'بادر2': 'bader2@fleet-login.example.com',
        'سعيد2': 'saeed2@fleet-login.example.com',
      };
      const email = u.includes('@')
        ? u.toLowerCase()
        : loginEmails[u] || `${u.toLowerCase()}@fleet-login.example.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: p,
      });
      
      if (error || !data.user) {
        Alert.alert('تعذر تسجيل الدخول', 'تأكد من صحة بيانات الدخول أو كلمة المرور.');
        return;
      }
      await fetchUserProfileAndRestore(data.user);
      await loadSupabaseData();
      setUsername(''); setPassword('');
    } catch (e: any) {
      Alert.alert('خطأ في تسجيل الدخول', e?.message || 'تعذر الاتصال بخدمة تسجيل الدخول.');
    } finally {
      setLoadingDb(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null); setUserTab('service'); setAdminTab('requests');
  };

  const resetRequestForm = () => {
    setReqQty(''); setCurrOdometer(''); setReqNotes(''); setReqImage(undefined);
    setFaultType(''); setRequiredWork(''); setServiceDescription('');
    setSelectedWorkshop(workshops[0] || ''); setSelectedEngineer(engineers[0] || '');
    setSelectedClient(clients[0] || ''); setSelectedStation(stations[0] || '');
    setSelectedFuel(fuelTypes[0] || ''); setSelectedOil(oils[0] || '');
    setSelectedBattery(batteries[0] || ''); setSelectedPart(parts[0] || '');
    setSelectedTire(tires[0] || ''); setSelectedMaintenance(maintenanceItems[0] || '');
    setSelectedUnit('دبة');
    setMaintenanceServiceSubModal(null);
  };

  const openServiceRequest = (type: string) => {
    resetRequestForm();
    if (type === 'إرسالية صيانة وخدمات') {
      setMaintenanceServiceSubModal('صيانة');
    } else {
      setServiceTypeModal(type);
    }
  };

  const openImagePicker = () => {
    Alert.alert('إرفاق صورة', 'اختر مصدر الصورة', [
      {
        text: 'الكاميرا',
        onPress: async () => {
          const p = await ImagePicker.requestCameraPermissionsAsync();
          if (!p.granted) { Alert.alert('الصلاحية مطلوبة', 'اسمح للتطبيق باستخدام الكاميرا.'); return; }
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
          if (!r.canceled) setReqImage(r.assets[0].uri);
        }
      },
      {
        text: 'المعرض',
        onPress: async () => {
          const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!p.granted) { Alert.alert('الصلاحية مطلوبة', 'اسمح للتطبيق باستخدام الصور.'); return; }
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
          if (!r.canceled) setReqImage(r.assets[0].uri);
        }
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const currentUnitPrice = () => {
    switch (serviceTypeModal) {
      case 'وقود': return prices[selectedFuel] || 0;
      case 'زيوت': return prices[selectedOil] || 0;
      case 'بطاريات': return prices[selectedBattery] || 0;
      case 'قطع غيار': return prices[selectedPart] || 0;
      case 'إطارات': return prices[selectedTire] || 0;
      case 'صيانة': return prices[selectedMaintenance] || 0;
      default: return 0;
    }
  };

  // دالة إرسال الطلب المحدثة بالجزء المطلوب
  const submitRequest = async () => {
    if (!currentUser || !serviceTypeModal) return;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      Alert.alert(
        'خطأ في جلسة الدخول',
        authError?.message || 'لا توجد جلسة دخول موثقة.'
      );
      return;
    }

    const tempId = `REQ-${Date.now().toString().slice(-6)}`;
    const item: RequestItem = {
      id: tempId, vehicleId: currentUser.id, driver: currentUser.driver || currentUser.name || '',
      type: serviceTypeModal, date: TODAY(), qty: 1, total: 0,
      status: 'تحت المراجعة', workflow: 'المسؤول المباشر',
      notes: reqNotes, imageUri: reqImage, approvalTrail: ['أرسل السائق الطلب'],
    };

    if (serviceTypeModal === 'وقود') {
      const qty = Number(reqQty);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      item.qty = qty; item.total = qty * currentUnitPrice(); item.station = selectedStation; item.fuelType = selectedFuel;
    } else if (serviceTypeModal === 'زيوت') {
      const qty = Number(reqQty); const odo = Number(currOdometer); const prev = lastOdometer(currentUser.id);
      if (!qty || qty <= 0) { Alert.alert('تنبيه', 'يرجى إدخال كمية صحيحة.'); return; }
      if (!odo || odo < prev) { Alert.alert('تنبيه', `العداد الحالي يجب أن يكون أكبر أو يساوي ${prev}.`); return; }
      item.qty = qty; item.total = qty * currentUnitPrice(); item.oilType = selectedOil; item.unit = selectedUnit;
      item.prevOdo = prev; item.currOdo = odo; item.distance = odo - prev;
    } else if (serviceTypeModal === 'بطاريات') {
      item.itemName = selectedBattery; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'قطع غيار') {
      item.itemName = selectedPart; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'إطارات') {
      item.itemName = selectedTire; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
    } else if (serviceTypeModal === 'صيانة') {
      item.itemName = selectedMaintenance; item.qty = Number(reqQty) || 1; item.total = item.qty * currentUnitPrice();
      item.workshop = selectedWorkshop; item.engineer = selectedEngineer; item.faultType = faultType; item.requiredWork = requiredWork;
    } else if (serviceTypeModal === 'إرسالية صيانة') {
      if (!selectedWorkshop || !selectedEngineer || !faultType.trim() || !requiredWork.trim()) {
        Alert.alert('تنبيه', 'أكمل الورشة والمهندس ونوع العطل والعمل المطلوب.'); return;
      }
      item.qty = 1; item.total = 0; item.workshop = selectedWorkshop; item.engineer = selectedEngineer;
      item.faultType = faultType; item.requiredWork = requiredWork;
    } else if (serviceTypeModal === 'إرسالية خدمات بنشر') {
      if (!selectedClient || !serviceDescription.trim()) { Alert.alert('تنبيه', 'اختر العميل واكتب الخدمة المطلوبة.'); return; }
      item.qty = 1; item.total = 0; item.client = selectedClient; item.serviceDescription = serviceDescription;
      item.faultType = faultType; item.notes = reqNotes;
    }

    try {
      const { data, error } = await supabase.from('requests').insert({
        vehicle_id: item.vehicleId, applicant_id: user.id,
        driver_name: item.driver, service_type: item.type, request_date: item.date,
        quantity: item.qty, unit: item.unit || null, unit_price: item.qty ? item.total / item.qty : 0,
        total: item.total, station: item.station || null, odometer: item.currOdo ?? null,
        notes: makeStoredNotes(item), image_url: null, status: 'تحت المراجعة',
        direct_manager_status: 'تحت المراجعة', services_status: 'تحت المراجعة'
      }).select();
      if (error) throw error;
      if (data && data.length > 0) {
        item.id = String(data[0].id);
      }
      setRequests(prev => [item, ...prev]);
      setServiceTypeModal(null); resetRequestForm(); setUserTab('service');
      Alert.alert('تم إرسال الطلب', 'تم حفظ الطلب في قاعدة البيانات بنجاح.');
      loadSupabaseData();
    } catch (e: any) {
      Alert.alert('تعذر حفظ الطلب', e?.message || 'تحقق من اتصال الإنترنت وسياسات الجدول.');
    }
  };

  const advanceRequest = async (id: string) => {
    const requestId = Number(id);
    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      Alert.alert('خطأ', 'رقم الطلب غير صالح.');
      return;
    }
    try {
      setLoadingDb(true);
      const { error } = await supabase.rpc('approve_request', {
        p_id: requestId,
        p_note: 'تمت الموافقة عبر التطبيق',
      });
      if (error) throw error;
      await loadSupabaseData();
      Alert.alert(
        'تم التحديث',
        isRequestApprover(currentUser)
          ? 'تم اعتماد الطلب نهائيًا.'
          : 'تمت الموافقة على الطلب في المرحلة الأولى.'
      );
    } catch (e: any) {
      Alert.alert(
        'تعذر اعتماد الطلب',
        e?.message || 'تحقق من تعيين السيارة وصلاحيات مرحلة الاعتماد.'
      );
    } finally {
      setLoadingDb(false);
    }
  };

  const rejectRequest = async (id: string) => {
    Alert.prompt ? Alert.prompt('رفض الطلب', 'أدخل سبب الرفض:', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'رفض', style: 'destructive', onPress: async (reason) => {
          try {
            const { error } = await supabase.rpc('reject_request', { p_id: id, p_reason: reason || 'مرفوض بدون ذكر أسباب' });
            if (error) throw error;
            Alert.alert('تم الرفض', 'تم رفض الطلب وحفظ السبب.');
            loadSupabaseData();
          } catch (e: any) {
            Alert.alert('تعذر رفض الطلب', e?.message || 'تحقق من الصلاحيات.');
          }
        }
      }
    ]) : (
      async () => {
        try {
          const { error } = await supabase.rpc('reject_request', { p_id: id, p_reason: 'تم الرفض بواسطة المسؤول' });
          if (error) throw error;
          Alert.alert('تم الرفض', 'تم رفض الطلب بنجاح.');
          loadSupabaseData();
        } catch (e: any) {
          Alert.alert('خطأ', e?.message);
        }
      }
    )();
  };

  const saveAssignManager = async () => {
    if (!selectedVehicleForAssign || !chosenDirectManager) {
      Alert.alert('تنبيه', 'اختر المسؤول أولاً.');
      return;
    }

    setSavingManager(true);

    try {
      const { data, error } = await supabase.rpc(
        'assign_vehicle_manager',
        {
          p_vehicle_id: Number(selectedVehicleForAssign.id),
          p_manager_id: chosenDirectManager,
        }
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error('لم يتم تأكيد حفظ التعيين.');
      }

      const manager = availableManagers.find(
        (m: any) => m.id === chosenDirectManager
      );

      setFleet((prev: any[]) =>
        prev.map((v: any) =>
          String(v.id) === String(selectedVehicleForAssign.id)
            ? { ...v, directManager: manager?.full_name || manager?.username, directManagerId: String(chosenDirectManager) }
            : v
        )
      );

      setManagerAssignModal(false);
      Alert.alert('نجاح', 'تم حفظ المسؤول في قاعدة البيانات.');
    } catch (error: any) {
      Alert.alert(
        'فشل الحفظ',
        error?.message || 'تعذر حفظ تعيين المسؤول.'
      );
    } finally {
      setSavingManager(false);
    }
  };

  const openDispatchEditor = async (req: RequestItem) => {
    let savedDispatch: any = null;
    if (req.type === 'إرسالية صيانة') {
      try {
        const { data, error } = await supabase.from('maintenance_dispatch_records').select('*').eq('request_id', Number(req.id)).maybeSingle();
        if (error) throw error;
        savedDispatch = data;
      } catch (e: any) {
        Alert.alert('تنبيه', 'تعذر تحميل سجل الصيانة السابق: ' + (e?.message || 'خطأ غير معروف'));
        return;
      }
    }
    setDispatchEditForm({
      workshop: req.workshop || '',
      engineer: req.engineer || '',
      faultType: req.faultType || '',
      faultCause: savedDispatch?.fault_cause || '', spareParts: savedDispatch?.spare_parts || '', estimatedCost: savedDispatch?.estimated_cost == null ? '' : String(savedDispatch.estimated_cost), finalCost: savedDispatch?.final_cost == null ? '' : String(savedDispatch.final_cost), workshopReport: savedDispatch?.workshop_report || '',
      approvalStatus: savedDispatch?.approval_status || 'pending', approvalNotes: savedDispatch?.approval_notes || '', repairStatus: savedDispatch?.repair_status || 'pending', repairCompletedAt: savedDispatch?.repair_completed_at || '',
      deliveredTo: savedDispatch?.delivered_to || '', deliveredAt: savedDispatch?.delivered_at || '', deliveryNotes: savedDispatch?.delivery_notes || '',
      requiredWork: req.requiredWork || '',
      client: req.client || '',
      serviceDescription: req.serviceDescription || '',
      notes: req.notes || '',
    });
    setEditingDispatchRequest(req);
  };

  const saveDispatchEdits = async () => {
    if (!editingDispatchRequest) return;
    const updated: RequestItem = {
      ...editingDispatchRequest,
      workshop: dispatchEditForm.workshop.trim(),
      engineer: dispatchEditForm.engineer.trim(),
      faultType: dispatchEditForm.faultType.trim(),
      requiredWork: dispatchEditForm.requiredWork.trim(),
      client: dispatchEditForm.client.trim(),
      serviceDescription: dispatchEditForm.serviceDescription.trim(),
      notes: dispatchEditForm.notes.trim(),
    };

    if (updated.type === 'إرسالية صيانة' &&
        (!updated.workshop || !updated.engineer || !updated.faultType || !updated.requiredWork)) {
      Alert.alert('بيانات ناقصة', 'أكمل الورشة والمهندس والعطل والعمل المطلوب قبل الحفظ.');
      return;
    }
    if (updated.type === 'إرسالية خدمات بنشر' &&
        (!updated.client || !updated.serviceDescription)) {
      Alert.alert('بيانات ناقصة', 'أكمل اسم العميل ووصف الخدمة قبل الحفظ.');
      return;
    }

    if (updated.type === 'إرسالية صيانة') {
      const estimatedText = dispatchEditForm.estimatedCost.trim();
      const finalText = dispatchEditForm.finalCost.trim();
      if ((estimatedText !== '' && (!Number.isFinite(Number(estimatedText)) || Number(estimatedText) < 0)) ||
          (finalText !== '' && (!Number.isFinite(Number(finalText)) || Number(finalText) < 0))) {
        Alert.alert('قيمة غير صحيحة', 'أدخل التكلفة التقديرية والنهائية كأرقام صفر أو أكبر.');
        return;
      }
      const dateValues = [dispatchEditForm.repairCompletedAt.trim(), dispatchEditForm.deliveredAt.trim()].filter(Boolean);
      if (dateValues.some(value => Number.isNaN(Date.parse(value)))) {
        Alert.alert('صيغة تاريخ غير صحيحة', 'اكتب تاريخ الإصلاح والتسليم بصيغة مثل 2026-10-26T12:30:00 أو اترك الحقل فارغًا.');
        return;
      }
    }

    try {
      setLoadingDb(true);
      const { error } = await supabase
        .from('requests')
        .update({ notes: makeStoredNotes(updated) })
        .eq('id', Number(updated.id));
      if (error) throw error;

      // حفظ بيانات الإرسالية في سجل منظم مستقل، إضافة إلى notes لضمان التوافق مع النسخ السابقة.
      if (updated.type === 'إرسالية صيانة') {
        const { error: dispatchError } = await supabase
          .from('maintenance_dispatch_records')
          .upsert({
            request_id: Number(updated.id),
            workshop: updated.workshop || null,
            engineer: updated.engineer || null,
            fault_type: updated.faultType || null,
            fault_cause: dispatchEditForm.faultCause.trim() || updated.faultType || null,
            required_work: updated.requiredWork || null,
            spare_parts: dispatchEditForm.spareParts.trim() || null,
            estimated_cost: dispatchEditForm.estimatedCost.trim() === '' ? null : Number(dispatchEditForm.estimatedCost),
            final_cost: dispatchEditForm.finalCost.trim() === '' ? null : Number(dispatchEditForm.finalCost),
            workshop_report: dispatchEditForm.workshopReport.trim() || null,
            approval_status: dispatchEditForm.approvalStatus || 'pending',
            approval_notes: dispatchEditForm.approvalNotes.trim() || null,
            repair_status: dispatchEditForm.repairStatus || 'pending',
            repair_completed_at: dispatchEditForm.repairCompletedAt.trim() ? new Date(dispatchEditForm.repairCompletedAt.trim()).toISOString() : null,
            delivered_to: dispatchEditForm.deliveredTo.trim() || null,
            delivered_at: dispatchEditForm.deliveredAt.trim() ? new Date(dispatchEditForm.deliveredAt.trim()).toISOString() : null,
            delivery_notes: dispatchEditForm.deliveryNotes.trim() || null,
            updated_by: currentUser?.id || null,
          }, { onConflict: 'request_id' });
        if (dispatchError) throw new Error('تم تحديث الطلب، لكن تعذر حفظ سجل الصيانة المنظم: ' + dispatchError.message);
      }
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditingDispatchRequest(null);
      Alert.alert('تم الحفظ', 'تم حفظ تعديلات الإرسالية في قاعدة البيانات. يمكنك الآن معاينة النموذج وطباعته.');
      await loadSupabaseData();
    } catch (e: any) {
      Alert.alert('تعذر حفظ التعديلات', e?.message || 'تحقق من صلاحيات تحديث جدول requests.');
    } finally {
      setLoadingDb(false);
    }
  };

  const COMPANY_LOGO_DATA_URI = 'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAWgBgADASIAAhEBAxEB/8QAHgABAQACAgMBAQAAAAAAAAAAAAECCQcIAwYKBQT/xABrEAACAQIFAgQCBQMIDxQJAQkAARECAwQFBiExB0EIElFhCXETIoGRsRQyoRUjQlJicrPBFhcYGSQzdHWCkpWitNLTJScoNDU3OENTVGRzk5SjssLD0eEmNkRFRlVjZYNWhIXwduLxR1ek/8QAHAEBAQEBAQEBAQEAAAAAAAAAAAEDAgQGBQcI/8QAPxEBAAIBAwMCAggCCQMEAwEAAAECEQMEMQUSIUFRBmEHEyIycYGRoVLRFCMzQmKSseHwFXLBF1OC8SQ0Q1T/2gAMAwEAAhEDEQA/ANqW79ikEe4BiUE5EAOEJkRL5JDkDIGPDLK5ANiJEbhOQCUICRIFJu0J9RIBPYSGIALcORyxwQFI3kQHwUGpES9xImQKRSH6j3QBhLuOUI35AMITuTlEFZSJ7DdFApN2H2ApJfoUkRwBSRLDUgB3KQdwKDF8jygX17CA+PQdgEyHLIixuAjfkpGITAoItluFugDfsUnCImQFyVreQFyUUncPcNbBFI3t6jj5BoBA3REtyxAU3aG5SRvyAgQRexUoApG36BjgIdwUnLCjCEQh22Abr3HIiRPIQEbckjcr3IpMD3Jyy7tegBcbjhhqRBRSdwmGpAMNwh7CNwC3HG4XBQIgER8kFbC3ItivYoMRuSWG9kwL3KTuICG6Ewth+AfAUJEdikbYGRIHcSQN5AndBFBr7B29Q1IiAI+Sj5iIApEI3ABqSka7hAPdiEGpD2cgI39hxA5QgBMlJ8gnIQneAlBG9w0FWI7iRwhHABuCmLTZZlegCBBE+wahAX2EiJ+ZJ9twLM/IRA4Q5ApEAuAElI1ISakIpJkDZBVI1IgcgIgBqQ9gD54C25DlodtwDKYrks7gBEhBhAQRcl7hSAx3j1C3AcoPcN9hwgHYLfuJle4juBSbyUk7wAncPn2EbiNuQKSAmUIkSHwGpCIohtInYcr3KKRpyF6B8SBSdwnIXcgj37FUiA17lBKBGwnaRuwEQI+wPbcTt6AR77F37DZCQDEBKCgRlI4YAQOAN5CEsblAVjDLuGE9vkA2RSTsOUAiBAXMBOUQUm8jsFuBSRCKYsoq2+RJclW4SgAnJTFPkvbYAxMBOQnIQncIpFyAjcNSF3TD2UBSBBIhSG9gLO47kTgVAIkswFzAakCNplSCfYNcAHwOUSJLEgEGEoHzCCe0CdguBwgoogcIRsIQE2kqQSQbYDh+xJ3Mib7gOR3HYoEUMJyUkwAbgSJfoHwEO4TkIdwpMlJAb3ApHuAn2AQOeCkieQDUh7CNwwhITkRIiAo+CJSVkTYF2kjgqUBgSJWxWwlAe4DsRc/IqJDkDIkfeGtiNgUpPMUATiSkYD5BPcm8FUkCJYT2KY+XcoyJA5E7gO4Y7lAi3+QbgbSI3ASRt9yxuGpgBHBSRsGtgh8g+NwmGpCqRk2E78gI9C8bdzGq4qXG8/Irq2lAV8e5GoPy8fqbKssn8tzPBYSOfp8TRRH3s/Fv9XtDYap03daaetNfsas1sJ/9cI9vTKcV6h8TfTDTVPmxetsnq2n+h8Zbu/8AVqZxxnXxFuhmQNrE6vdcc/QYWu5+AwmXZmfrFOotXxUfDzQ2lqXMqqv3OU33/wBk/KzX4rPQ7D0VVYLMM1xtS4X6m36J++kLl3OcQI9ToHjvi7dN8O3+S5LmeK+du5T+NB69ivjIaWstqxojMb/zvVKf7wuJMtjyewk1m3vjRZZRS3a6Z425D2TxsT/0Z4P59PY3jpVi2vX9Ul/kxiUzDZzVsFujWMvjTWW3PSnFwv8A7kv8mYfz6bDqqX0pxiXtmS/yYxJ3Q2ePYco1n4b40GUXl+vdNsfZn0xrf/dn6uC+MhpW+ksTonMcN8rtVX/YGJMw2Nx9xGoOgeX/ABdum2JqoWKyfM8Ku7Vu5VH3UHt+B+Kx0Mu21VicyzTDVd08tv1R/ejC5dzpI+TqH/PU/Dwo82pcypfo8ov/AOKeyae+Il0L1NXRTgtXOh18flOGrtf9aCDszH3E7nGWT+JTpnnlKqw2tslpTUr6bG2rf41H7tHWPQVXGt9OVT6Zth/8cD3GBuevYTqBpfM/K8HqTKMVPH0GPtVz91R+1bxFGJpVdqum5Q/2VFSaCvMtizuYOtUbOQq/NwBm5EmK+Zk/vAMcbhuBARG5KoDC2YUZE5ZXuhukENkOSc7hoKrfoRMLkrhBARAS7hkUZFw0VMJQAiEHz7EgKYKMjHvJW4HcAt0UnBQJMhbIRAcgRuSopI3ARuGpKAJwtxyUk7bAI3HLDEAIJCLIAdygk7gE0kHvBSOZAfiBG5SCJyOWIa4ElFBN5DcANmUxW8l7gUjKAJI2YROOwFcDgpICKTuGHwBGpZVsgg3AUnYIINxAQlbhQkHwEFN2h3HKC4APsJnYQICIu4iUXmSccBVjcdyka9CIoI+AlsVU4ksTA4QkCkSgPYPf5ARuS8IPbcTuAmQUiiSCNehUoHcPgoPgLgLgPbggJQHsG4HYBMEkq33EQtig0PcFAEXLCUCN5ARuHsORIEiSpQJbCYFIJHeAG8+wjcccsR7gRos+xSb+oDzBKBHoJApHu0ORytgKRiPUSA5Q7j5iAHID2JL9QKpckXJduQnICPQpO45Ae47j9Af6QglAneCkS35CncIP5gB8wmGEwEyxI7kmWEWWhG457B/MKTDgTDHcdwD4HKC5YgCkncdwgE7jzD7QmgKSQ2RchCdiobSOAqkWwncAJEgoE54D5kOfUcgR8mRCgR8E7FbHYAicD5MvPzARCG8E39SrgByid/cyJO4QgITuSYfMAVcBuDF3FDafHJ+JnOtciyDDXb2YZzgsHbtKa3dv0qF8pkK/cTl+xHUqatzrdrf4hPQzRuHxVL13gcxzHDzOBwtNzz1Ndk3RH6TrPrH4x2U4jDX7WktAZpexVDaoxONu2nZq9HCqTGEmYhsp86n2PDi8ww+BtO5ib1rD21zXdrVK+9mmbV3xROtmsMuu4bD/AKkaYVTfku4O3cpvJfNVNHBmp/Ed1b1vgr2F1D1K1DmWEuyqsP8AlbduPSGjrDjvhvd1N1n0TpLBVYrMtUZXZtU/neTFUVtfYm2cGah+Jf0FyP8AKLVOrK8bi7Mr6CzhL31muyq8sGkb9SsI667l2zTiblTmqu+pqbP6sPh7WG/pFuiz7UKC9qd7aVnnxkNFYLGV2Mq0FnOcUram/Ti7dpfOKqTh3XfxbupGOvVV6S0xg8ost/VWY00X2l7w0dG6rldbiqt1fMwdC5gvbDnvl2bz/wCJP171Th6qLudZRlbaicFgqrdX3qo4tzHxQdas0xTv3uqWf2p3dvCYy5bpXyUnG6QiC4hO6Xsmd9TtY6mVX6r6v1BmLq5/KMfVVP3np93K8NiL1V2+rmJrf7K9V5mf2dh3GEzL+enLMFSv9KWX86AsDhaVtg7Cfr5Ef0QEVMy8dNm3RSlTat0P1ppg8iruUqFXUl7MeggIyV+6l/TKl9o+nuS27lX3mJEFZVXK3SvrNv5hV1LZ1MgmQjJ3G+GzF1Nt/WaAAtNytLat/OSu9cj8+p+8mCG69wq/S3Y2rqX2mNTqfM1fMu5fmEeK5h7d3eu1RV80YfkOE3bwdlv3oR/QAvDwVZdg6ucHYW3ahI8NWSYB1eZWnQ/3Dg/tlgGZf2ZNnWZ6edP6mZzmuA8u6/J8U6YPcLXiE6sYKyrWB6naowtFPFH6o3IX6T0OPVAmFzLmnR/jV66aOqVVrX1/NYc+XM3Xe/Go5Ny74qPXvBXbVN+nT2Ow9L+sqcB5a6l83WdSYgDEL3S2OaV+MRcyzLktTdOcdj8Ul9a7gcXat0/c0zlDQvxcelWpKks7y3MtLJ8vETfj+0oNSlNXlcpwZvEXfL5fpG16Dthe+W83RPj06J6/xtOFyfWdmvENx5cRZuWV99SRzRgtd6dzF0fk2f5XiXWk1Taxltvf2TPm9uYDCXanVcwtm9U+9dMs/oyZ39N5jTj8mxuKyjFLi5g61Q0c9rqL+76VLd+i7Qq6KlXQ+KqXKZkqlvuaAdOeLfrhpi9YWA6oZ5XhbP5uFxeKqqtx6QjnTTfxYOsOQfk2GzLKMkz3C0Qrl2i3c+mrXzqriSdsuu6JbjE1AnY10aS+MVpO88PhdSaIzfK79UK5iqb1r6JP5JtnZjQvjp6I6/rwuGy7X2XU5liEv6Cuq5TXS/Rt0JfpOcLlz/5lEhn5eX6nynM6KKsJmeDxPnU0q1fpqb+yT9F1pd+QrP5ieSKHyEFVPYTA5bC9JATuUi2GwDjdjsGvcnYBPfsWQgBG/VFmeBG5QI3BOSvfuEmghwUn2lChO477lAE3kLYcgJngMccDtyEGhPYchAE5DiRJQqPdeg4QakECdxBJEsovKI1BUUIEXJG4ZUwqkezkbhyBJ7wVqSdioIMJyUnAVGZEakfaAiSJSjInIQgNbhfMdwqkjcpI3CHsyOUWRHqFUk7lJICQ0JC3QCXIHA90AmCchP3L+ADlCfsA2YDlbiYgQAKRORHoUCTKHeRsxyBSNSO4bgBIidx2BEEE5+Q+Q4CjcBORuwpKKRke/BeO4QncJ7BDvyFJ2HKJDKAgR9pSJQQE9gyBsqK+NiLncQVOSKchAdyg1IhFItpALZD7CehVzADkCd4EQAfPsCkTkCNMT7lbgiAvzEJDvuSdwC25KkOQA5WwShFAEbnYR94iA3DIh2CjsOURIqr29CkiUOAHsThlDcAJ34EITtITkIMnJkR7ASYbLyhtInkijG8jsJgofLkTHIEAJn5D7A1tBQiP0C2cESclaCp67DlFSJIDdFfJJks8AUEfATCG8BBuBOwFAJAVHzwXlBkQB7FROXuNqQLH3DhHixGJt4SxcvXq1as26XXXXU4VKSltnXDqv8QXot0psXHf1Zhs8xdut268Dk9ym9eoqThp0ygjsk6o5ZhdxNuxTU7ldNtLeanGxqr6s/Fz1Nm2Jx+X6C0ph8FllylrD5rmNyu1iKffyb0ydPeoniC6m9XXZq1frfMse7W1Nq1UrVKXpNETydRGXM2iG6DqX44OjfS14vD5trbL680w8+bLrNbd5tdlKj9J1U6i/GDy54R/yA6JxmMxCqdP02cRTZq35TormDWXVaoV93ody7VzXcrdbf2s8kT7eyOu1nN/Z2S6m/EN65dQcar2A1KtGYZqK8Nk1Upr+zpZ181BqLPNXZnczDPs+zHOcXc3rrxN2Jfypg/hfoOO5YiHPdMvHaw9qxU6rVqm1U+Wt2/vMqlLmd+7MpTZGVMsUvVlVO0TyVwPcInzC5G+44YFlBkXsJAr+Ygc8CNgJI7hAoIAckCAUgAAcgJgAATeSgATsEI2KAQCEAQqA4APkAgFAAAQAt2Bew2gj5C3ANKNthCaA7ANlEbEdKbkoAipczS/KYrDWfOq67KrrXFculr7jyL9A+YXL9TTGstTaIzSnMNO6mzPJsVS06asPdny/wBtJ2A6afEU65dPsXVezHUdOtbMfVw+cVxH9pSjrU9lIlN8faMQvdLZZ06+MRgVgv8A0/0RjMJiHVH0uTRVaSnl+eqTtR028dvRbqbTgrOX63y/D5pioVGW4mtq8m+zSUfpNFVVLa529zxV2KHdoub03KPza6KnQ6ftRzNXcX930rWMXaxNumq1cpuqpTNDk8yc8fafO/0967dSOkt+9e0lrXM8tru80XKldpa9Prz6HbDpX8W3XumKMvy7WGm8FqHCqpLE5pYu1vENd35ElTJziXcWiW3B/pC2OqnS34lHRTqVXVbv6ip0riKEvNbzx04fzVelMtydm8i1Bl2pcrsZjlWMs5hgb681vEWKvNRUvVM5dZfoKWxGxaWGFO4nf2C5DcAUj4EyAEb+wfGwmUONgHlHD9gwt0EIkAPgKkSwnCKmRAVOUBMdhz9gFBi/WS8KQG4UhOSgCJQUjcAI3ATkoGPD9i9twxygI/vKlsPKUCSH+gcuBO8ANguduA1v7AgiZYERwG4RRHt8i8kfAkCvcDvIQBKA/YMTCAoBIkByw/YMLuASh+wn2HcdwifgO/zHK9CrgKNDbgk7lakCNb7FT9QhE8gGT5FakmyAIvImShGK39hDKt9xIUa22Jwxx3EyBZ34DQ5E7wAXA2YYQE5exYAbgCgjcDkiHPsHwG4HcqiUEaKOOQHCHyDUkXIF3EhFAnf2EBbDuBNyyFICBSbjuFJ3E8lJ3ALgiXoVhcATjcske7RkBOUG4QcyJ7AHuSd9ytwOeQHIC59gyCkC2CKhwhwGGFFywnI7SEBSPYNwEoAIpO/sGA4DCnYpBEOBEBL7iiNos+gnsIcASIZZQYnYBtBIQSncsQ/YAthHcDvIEiEUpEBQRveET8QEwPcvIaAJyOeSkYFJHcJ7lAicj2HBG5CLG4lwSqtUveT8LVOudP6JwdWLz7OsBlFhUupVY3E0WfNCmF5mpfsgP3vMiOtI6KdaPiydOtEu7gtGYLFaxza1cqtXKPo67Fmlpcq55XTUp9Dox1o8e3WXrXZxWX4nObemskruOqzh8rX0V+in0d6hqplxKTMQ269WPFb0x6MYDG39R6owlGIwk/SYDC3KbuK4mFblNnR3rB8XnE4rFYnAdMtMK/g7ltq3m2bOqxcoqjZq200//I1z4uu7j8VcxWMxF/McXd3rxGPu1X7lT/fVSzGhVLZ7UrhdjvtZzf2cldT/ABJdUusmPpxeqNZY6uumafyfL63hrfl4h/RtTt6nG1Nq3S23Qqq6n5qq7n16m/Vt7nkW3yJJ1hxM5V70x2MY9TKdiTIcnYTHsHsyNAXefcSgn2HcAlBHvuJgsyBBPuVIgFiSTBYYgCArUE8wAvBi6knDCaqAvI4Rd4kn1m4VFT+VIAPYNeX89qj984I67S/9ow//ACtP/iBZ2IeG/j8LYjzX7b/e1Jngt5xhr1Xltq/db7W7NVX4BcS/uEz7Hmw2AzDGJOxk+b3k+Hby67V+FJ+jZ0bqbFKbOktSXl60ZNiH+FBMwdsvyByfuPp9rX9joXVVS/rJif8AEJV0810/zdA6pqfp+o2JX/YLmFxL8RNIe5+z/K618/8A/Hep/wC5OJ/xDy09ONdQ/NoDVFPyyfEv/sEzCdsvwZB+7/K61rS1OhNVL/8AcmJ/xCV6B1dQvr6K1RQv3WSYn/EGYO2X4T4Cex+hf03neFlYjTmfWY/3TKb6/Gk/gxNu9g1N/AZnYX/1MBcp/FFzBiUe45P4/wBWcJ5nTVcrt1Ltctun8T+m3iLF1N04iz9txIGHkBhVetU/7fZfyuJmdFLrU0/WXrTuECFirvS180YupTEqQKuCk8wncKpexG4YW6CAgLcvIE7BP1Ej5AWdiF39Qih8yFbJ3IElakdibgIkLbjYFfAHivYa1iKXTXbpc90of3nuXT3rFrzpTm1rMNLauzLL7tlRbs3rtV+yv7Ctun9B6kkIQ8LEzHDvR0l+LVrnTH5Lgdf5FhdRYeuuL2aYWry3qaZ5VqilLg7x9IPHl0e6w2X+pupacpxFLVH5NnKpwtyqpuIpTql7mjNz8l7HhuYei75KnR9Hdoq81Nyy/JWn6+ZbnPa0i/u+lbDYmjFWaLtqtXLda81NdDlNfM8smgXpF4t+rnQ+9XXpzVV7H2bkKrC51VVi6VTMxS7lT8v2HeLo58XjT2Pu28D1LyLEafuUUJPMMDTXiaL1c8+Sin6q+05muHcWiWxqUI2PTOn3WHR3VHLcNjNM6iy/NFfo+kViziaHepX7q2n5qftR7jTV5l6fM5dK9/mVJISROQrInJI7F4REJgdwnuE5CqTdhCShGw4QkbyQF2KCNSUUklMV6AIT3CnkqTgNwAQXLCbDApHwIn5CAigAKklIHuA4YncfgN5AJ9+w25EyI2AMbgbx7hB7MbwUiCiUAJQUDHnYyIp7lAk7hCJG8e4BkXJQ5ASOwaG4DtuPYbhyAgcMMbyEJJ6FiQ02FG3I3EQHwAe44QTKBORBHugpAq7jhDgPeQEoNSSHAkCtwF+gIIA2SeCsBE3n3K3BSOewDuGUigKSHsUBEgP5gNSFIEhOSgCTuIEeoFBGOeCCkgpJApOFuUFEj0KRqQwKSNwhO4DuIEevISgAUnqE2BKi8kW/JQKTuB2CDcE5Ze3uFtAVSdygCQFsGE+AKCcckncgsBSUncoRIZIh8la7gGI2JO5WESGyhbDuFPkRlgoREGvQpFsFSWX0DUhcgE1uw3sIJEtgZAkbEmPcIsQODx3r1Fi27lyum3RSpdVThL7Tr1198dHTDoHhsRazDObOcZ7Rad2zk+Ar8128k4hVpOlb+rBl2Iqr8qk4h6zeKvpr0Kyr8s1TqPD2qm/JTh8K/p7rqmEnTRLW/qjWH1y+Jt1N6qPF4LSdL0LkNdadm5bqax0Rv+uUVRzPb0OomYXLucZlezHMsRdzLMr1XnuYzFVee7VV6ydRWXE3h336y/Fu1PqOjEYLpnkNGSWlXXa/VHNKab/0lEwqqafqulxudKNedR9X9UL9y/rDU2ZZ9VVdqu02b+Iqdi232pobcI9eUty35n6srZ3iIZzaZeOxbps0+W1RTbp7qhQmeSNhxsJRXKfIvYfYOQhGxAggG6HcdipSAe0EHqEBdmydgtyVfV7hV+YezMVXLhbldTbiVS4lS4CMnt3H2HhWJtXLv0VFbuXv9zt0VVt/cj2jRXTHW/UPM3l+ndG5tmuJf5qptfRL764RMrETL11NIP1h/cdnunPw2euetsYrWb5TY0Zh3xezKlXYX/462dg+n/weLuFxlT1xr95hhqp/W8lprsP+/TJ3Q67Ja3amo/PtqPWtI8eFxNGLvuzh6L+Ju8eTD2Krjf8Aapm5bQnws+iejMYsRey/G6icy6M4rovUv7PKjnXS3hi6VaKv0X8i0DkeVX6HKuYbCU01J+pO512NCGVaD1Zn2YW8Jl+kM7xVy44pqqwdy1S/tqpg5oyr4f3X/UOFs4nLtEW7FmtJqvEY+zKX711Jm9SizTatK3RSqKEoSXYqo8vuTul12Q1C6S+Ex1U1DYTzrU2U6dqdO9Dw30zT9JpqOR9G/ByqwWLVep9fvM7E728BRcsOPm2zZn5EZRDJl12w6TYT4SnRB2qVjq9SYq6uWs2qVLfy8p7Zpv4Z/QrTFVLs6bxONjf+jsQr340na2J3KRcOGcq8H3RrLbf0dPTjT91L9lfwNut/f5T9jDeGfpVgq/Nhunmm7DXenLraf4HJvcNAepYLpRpHLqUsLprK8OlwreFpX8R+5hMhy/L0lh8HYspdrdtI/RTDQGP0cLZJBU1J9vuMuUF+gDGGkIaUmSYjZgYtNo8V3B2r6auW6K0/21MnnXAq4A/BxmiMizFv8qyjBX55+ksUs/Gx3RPQuZKMVpHJsQvS5gqKv4j3fuiNRuDDi/EeF7pHi63Ve6b6au1PvVltpv8AA/AzzwXdGM7odNzp7kuHTUThcJbtv9FJzhwyNQB1Gz34XHQbP7lVV3JMxwbqc/0HjVaj5RSep538JDpBcwddGSY3UOAvtfVqvZnVXSn8vKjvMt0F3GTENXGffBtza7jnXknUixhMP/ueMw1y8/vlHoGtfhP9WdPWKqsjzzKdR1rimmx9C39tVRuFj7iKlTMblynbDRRmnw/fEBp7DXcRmGibd6zRv5sPj7LcfJVNnEOoum2tNLY1YXMdF51YuLmq1hq7y++mk+jZ0+Zehi7ezUyn6l7nPZD5q8fRVlUfl2HxuBfenE4S5bj70hbrt3KVVRet1J/u0j6GtY9CtA6/dT1JpDKM6VX535ZhlXP3nEGu/h09Ddb4d2aNG4PIG1H0mUWaLNS+2GXuc/VtIaVXKUr1TksQpextR1V8IHQVeAuU6Y1RneXYtp+R4zEKu2n8qaEcGao+EZ1O09l+IxOWayyfUFVLbt4VYW6rlS7KamkXuhOyXSFIHMepfBl110ZYxGIzbpzj7mDtTGJw1y15Wl3jztnEOJy/McDXdWOynH5b9E2qliMNXC+2ILmHPbLxIvseKxftYhea3cprpXeY/EznZxv7orlZkIJy4MuCjEIsCIIqeo4K/mOQiMFSD2ANSR7FnYnYAyVJV0+WpeanvS+GZMehR/ZpjUud6FzC5jtLZ1j9O46tQ7uXX6rMr0fl5O5HRH4qnUDQFFGC15l1rWGVWqVRbvYNKxfp25rqqbdTOlXlTckVEbptMkxEuotMN7HQ3xvdLeu1umzk+fW8DmdNumq9g8wmw6KmvzVVXCq3lbHPlm/TeoproqproqU01UuU16yfNPXhbdWIt4jejEW6qa6L9vaulpymmdluiHxBurfRW5aw+KzSvWeRqqmmvDZnVVdv27af5tup1JLYzmrSL5bxpCcnVjoD8RHpb1xpw2Du47+RXUF+t0UZTmVc1vbnzpeT179jtDhMbYx1im9hr1vEWalNNy1WqqX8mjlo8z3I/wBA5Ex7hVT9Q4kn6SzuA5EwNlwPcAymK3MgI5KSN5KBG4E7iJDUgRwWngi2cFmOwBBjgnIF7FBE5ApI3KTgCk57iZC+QFJ3CciQJyy7yIQkA2UEIDkL1Eidyg3ARScAUg7huAKCFCI90ElA4KFSNigkgFvuEykjcITAbgpJ2CnKEBfcI3kAnIfAew5QDgJySNizACNw9ikakByglsUkQBG5KikYD1CEDeSCkfsHsEoKhuIDUhbBRiSkjcIPgege6EcABIZGtwq9/YpONh2ASHtwA2yCgxTMiid/Yd/cc+wAbhbyI3CAce44DmQA43Hf2KSZ7ASYkqXckQpKmAh/InzRSgQL0ASALuByI3ApJT2HPsEoAKeBEdykakByxCQTESwD5Q3gTuUCPYSxyOWAXygclJEAOBO4e4SgA+AEFuAW3cd/YQOAKTuGpJ3QF3HDJLVUHXbxEeOfpl4e6b+CzPN7eaaiohLJsDUq8QnV+a6qZW38QR2HuXabdLqrqVFK5dThHWrxBePzpb0Gt4rB3s2pz7UdmV+ouXObyfCb80UxM9+zNbPiD+IJ1P67V38BgsT/ACF6cdVVDwmX1t14ijil1+aYfyfc6w27SpqddTqvXal9a7dqdVVXzbOohxN4dneu/wAQzqx1pv3sLl+Y16K086nR+SZc3Tev2o4uy6l93odZqLaouVXKnVdvVfnX7jmqr5lWwNI8MpmZVU7MkQ0FuIDlW2OxN+BuBdoIO5U9wH4B7dxPPYkyBU4JJTGVT3gC8CRUotutpqhKXV2R4MHiaMzx+HwOBprzHGX6vJbsYReaup+iQXl/RMBbnPXTTwJdcOpuJVFjRt/TmErSqtY7PbdVmipeqak7QdNvg81Y7BWr/UHW2LoxlFaqqweVUW67NS9G6kmc90OorLXDcxFizWqLl1UVPilJtv7j2vQnSTXnVequ1ovRuaaguUOG7FFKp/vmjdZ038CfRrplcweKy3RmCvZrh0l+X3/NVXU1G7TcdvQ51wOS4DLdsJgsPhf+JtU0fgidzvsadenXwsesWt8qw+OzbGZVoyal9Jg8Wrn5Ql/Yqqk7LaN+EH0+wVeDxupNSZzneMtRVew3mt/k9x91HkTg2A+VIsI5zLuKxDhDRXgv6MaCv4fFZN0+yjC460kli1bbuNru94OZbGV4TCU0qzh7VlUqF9HQlsf1RG4iSLhj5E3uVLcQmzIKiKCKQgwhyOEFJjsJ3EbyUCbyE5KY7+gRkARsKnZwWYQSgR7hBOQUBWPoZEG8gUjCD3QD3EfaHsJACQlAjcAOBG45W4FIueCkchCYC7iBIUe5ILyygYqF2J5U3wZkiAjC5Zpu0+WqlNejUnr+punem9Y5fcwOdZJg8xwlxNVWr1pQ19h7IAYdWeoHw2uhetsDcsYTSGF01frmcXlVPluT6/WbR1r6jfB3qt26aen+ur1mtc0Z7VNP/R0GzmB5UXJiJaL+ovw/OuvT3MnYsaTq1bg6aXVXjclX1FHr52n+g6/ZzgcZpvML2AznL8VlGMsvy3LWKo3pf2Sj6TqrVLlRM9meq6v6WaT15ld7Ls90/gMxwt5RcouWUnV9qhliziaQ+dS1dovW1XbrVyn9sjLhm4Tqv8KvpDr1U1aftYjQl6n63nyqlV+Z+/0jZ1J6mfCm6paUxGOxmls1wmqcrs0zasYiqMVc34VNFMTwdRZxNPZ0x27iYWx7R1B6Sa/6SW7d3W2jM303auVeWm9i8O6LdXybPUsNiLWOl4e7TfX7hzB1y4xMcvKuA/YjlONpCCLOwX6B+A+RQmPcNjdhIgcINh7hcAOGSpbbMMoHivWabvl829VP5tScOn5Qc89DvG91Z6BV4fC5bnVzUeQYe3Tat5NmtTqot0p/sPLG8erOCtg+STGViZhuf8PHxIumfWqq1lmZ4p6R1JVXTYpwGZNJ4i41zb8sqJ23Z2yw+JtYq1TdtXKbtutSq6HKaPmsqtq5vxVS5VVLdLT9ZR2E8Pfjs6oeH25YwlrHfyWacs0uijKczuNKie9Lp3bW/LOe32bRf3b1VHYNnWPw9+P/AKYdd1h8Bbza3kGpLiopeU5jUqLly49qvo1LbU/ijsyqpe+xw7ZUmRivbcshThyA1JQBJnsAkAkbyGUCRHuUj4CAm8CIZkTuBScB+oe4DlegfA7DjYIIpICUBTv7CNhMjgIE2ksSwFO42YQ4CEE+wr4CkKJFBNwD27AFAnbYktF4Q5QQYmRwuShU/AOORAAPjYc/MpO4QfYRAQbgKN+w9BOxSARuEGOQHHyECB3KikZSc/IikhiNvUcoopJJBZ9gKT1AewE5LMBBv7QhJScrgingKyABBHyhMjkblCdwuAkpKBHtyOEI3HEgFwJE7CUEIE7wHwAqmPD2Kw9+AE/eJ23A5ICew4QbaKUTeR3E7lAE9hG4YBCQtuShAGLW5eUFGT3kvBQInJQR8BCNw92ONiKWFVKCkfKKBO457iQlMgT5F4EpByA4CCQ4cgUjQTkoETKQfgA47jcjPw9Ya5yLQOUXc01BmuEynA26aqndxd6m2nClpeZqX7AfuVVKlPucQdc/FV068PmXV4jVudU2sUqXVTl2Ei5iri/c25UnRvxIfFbxeZ3r+TdIcKrdj6yrz3H2ofpFNupQ/WUzXpnma5hqXNrmaZ3mOKznMLjdTv4y7VciXLVKqbheyOojLibRDtd4ifiTdResNWIyrS3k0hpe5Rcs1V2vrYjE0PZOpVKaHE/mvudSL30mJxVWJv3buKxFf597EXHcrqfzqkJQjLik7iIhlNpk78hpESbK0VwiQYLtIEAbkABzAYSARBfdsR5nt9x4a8VatVJVVKqtuFbo3rb9lywPK2nuhVUlS6mmqVzV2Ryv0p8J/VrrVi7ljTOkMThbdNPnWMzmmrB26ltvS66Uquex3g6R/CFySy8Pj+pOosTnFdVH67leCmxRRV/xlFW/3HMzDuKzLWblGGv6hzW1lmUYXEZtmF38zD4C39LXV9iOwfS34fnW7qtRTiLWQWNMYGm4qblzOLtVi/5Z3aodLT29zcT028PmgelGU4TAad0xl+Fpwqi1ibuHouYj7bjp8z+85EVC53k5mzSKR6ugfSz4RugcixNrH62zzH6tu10L6TA10qxaoq7xVbqTZ266d+H/AEB0symzlundMYDCYW1Hkdy0rta/sqk3+k5DSVPYsHLqIiHjos021TTTSqaUoVNKhIzSXAneB2YdKlAb3E8EfIFexSTBQgTgcoJBSJKSQwEwJmRMoi9AKuB3HAQBB77ByRcgVCRwtwlAFJEhuBP3ATjZBb/MszwYgZcITAkRsAakJMPfgJMB+kSEGpApNpA2YBOSkmRvIFJ3EwAgyJIyMV6hVliUIgjmAC5LwwtvtKBEO4ewXAQbgCZ4EhVJMclAEQgpFtsAbMfL5uUZNSUI/NzXT+XZ3aVvMMuwuPo7U4mzTcS+9M619WPhy9HOqf5biq8kqyTOcSnGPwVyteRvurfmVJ2kezENgajOsHwm9e6TdV7p9ntjVOXWqXXXazWqnDXI9KVSqp+86ga46Zaz6Zeb+TDSuZZDQq3bpv3bFSs1tOJVTiUfRk6Uj8rPtKZNqjDfQZxlOBzWyuKMbh6LyXyVSZ13OJrEvm7s3reIT+huU3Vy/I5gzTn3NxvWX4X3SnqXdxeYZTaxOls7xNXmeJwlxuzT8rSapOkHWn4a3VrpX+W4/I7VjWWncNQmr9qum3iat42s0+ap9jqLOJpLqixG5nmeDxuQY54HOcvxmTY+lTVhsxsVWKl/bJMxW6nml8NHThFsyzKZOGE4CECSyRgFwCr2J6gFwTyzBewSkDB26vpKbluuvD3afzbtit0V0v1TW52u8O3xGOo3RO7hMrz6tax0pQ7dvy4n6t/DUcVVU+VTW49X2OqnHzKpT9CYiXUTNW/Xob4rOnPiDwFF7Smd0V4ttqrLcXFvFUe7ty4X/gcwJp7rk+bLKs0x+ns0tZlk2YYrJ8xtVU1U4jBXqrbcOUqvK1K+Z378N/xWM007cw2S9XMJ+WYF3FTTn2BtN10URCVVqlevdvucTWW0Wy2p9hLk9V6fdTNNdUchs5xpjOMLm2CuJN1Ye7TXVbntWk35X7M9qTTOXR3KSShUYncMoRN59hIQjuFUjcBOQwKTylI99gEbQFwO2wXARTFwzIkAJhwSdvUrG4Uj1HIjcNAN17lMWo7le+wCZ4DcCZIp+YFqHoFIfICYCclI+QD23HGwn7x9m4BbocBORG4FJyIKERKCkkRvJFTlFQ2gpUSYAaJG6Cq3sEw9kNkBGo+RYkoAkh7P2EjuATkm/JZDaICYDTCKHJQR7AO8BokSVzACR7hfpE7gFt8ykaHHICNhElJMATiosiGEoAJyUj5RSASJKTuUR/oLPYINx8gCCgpIgBtI+QS5Ca4ARITkJjaQKCN+wncIPgc7CQ9gqQVSwnI4QFI3A3EeoDuHwBMAEEE5E+wDuR7cFTkPkCb/ADEv0KlAneAEbpiI4Ej5gFyO4YakBxyGG4KBEHIiA3ABveEeO5cVqiquutU0UqaqqnCS9ZPUupfVnSfSPILucaqzrDZTgrambtX16vlSt39iNUXik+JZqzrDVj9O9P1f0ppZ3Harx6raxWJppqiaK6WvLTWlw1w4LEZSZw7r+KX4iGh+gNeIyLK61qfVytKqjB4OrzWrfmX1XVcU0ynzTzsaout/iC174hs/eY6zziq7ZVPltZZhZtYehS3vQn5W9+fY48VKrvXr9x1XcReqdVy9cc11v1qfccncQwm0yxpoVNKpppSoXCXCMnSi9+Sc/I6ckbewK1CIAezLLI3LAQ4AEtIASYDrpoU1VKlercHtPT7pXrPq1m1vLNGabxueYq7TU6a6KPo7Sjn61UJ/eOFxl6s3Evher4PPk+WZjqHHU4PJcsxucYt1U0/R4LD13Um3CmqlNJfM2I9B/hJX8dTZzTqtn1bs3KKa1k2VzZrtV8xXU/NTUp229zv70q6DaF6M4CjDaS03gcor+jpt3MRZs003byXDrqSUs5m3s0inu1adHPhbdTeottY3V2NwujMrrppuWrSav3btLfH1XNDj1O/fRTwB9IujFuq7g8gWdY+6l9JfzmpYpKr1oVa+rwdkfKvvL/EcZaxEQ8OFwNnBYe3YsW6bNm2kqLdteWmleiR5lSk9i7v2C5IHdkS2MgFTkPdx2KTkIjUFI3OxkFY7wI2MiRLANT8hE8iZCcgIQSgP9IkAw3A7h7gSFJYKR9gG6QTKYz94GRIgblAETHcQggxtsJ34DcBRQN32EbETfoBXCDHO4TkBMME4kTIRSdtypCFAUTkcBCOQhwHugvkThhV4QWwbD+8BwRrfgyJO4BIdwlAe4Cdw0IKABEPMEH+kJbiBxwFGEJCcgI23CE7gISNxEBhSPUMcFAickfcs7wUgxgnlSX/gX7C8wUcbdT/DxoDq9gMZh9TaawONu4qjyV4ymzTTiKV+5uRKZ0G63/COxeBeNzHpTnn63TQ3ZyXM63crrqnZK7U0kbQu/sYtL0GZSYiXzr9T+j+uOjGc38r1lpzF5bfsfn4mzbd7Dvv/AEyleXv6nqFNaqU01U107b0uT6PtV6OyPXOT3Mq1DlWFznLbn5+FxltXLdXzTOkXXf4UGjNY/leZ9PswuaQzm9Wq/wAnufWwSS5StUJR953FvdnNPZqgS2kcpHKnWTwvdT+hGLro1RpnE3cudyqizmeBo89u5Sn+d5aXU0oh7nFdNyi5SnRWqt4a4a+zk7zllMTDJboxfIlSP0hBgr4kgDksQyBgSN5L5U6WnvS+aXwxwX85pfpA9w6V9ZtbdDc7ozjRGc3ctv27qvVYK63Xhb1S/bW5Sf2m0nwu/Ey0l1axGH09rOlaW1Q6qbdFd7bD4htb1eeFTQp7NmobhnixWEt4yjyXaVXTHD5XyJNcu4tMPpWw2Ks4yxRfsXbd6zWvNTct1Kqmpeqa5PLJpE8NXxA9feH2/by/OLt7WOkIppqwmIrdWJsKnalW66nCpido7I21dD/EhoXr/p3DZnpPObGKuV207uCqq8t6zXE1UOlpN+VypSjYzmMNomJ4coNlYlMMiqTmQigASRytgqkjcRvI7ACkAE3RZ3HmHcBO4biCkakgpJ3JMiYKK/vEhBqQCUILgcBqSA57EXf1L2J7gVCJKSShstykb2HKAMpGJ79gKCITvABKB3DCXcA1sUAAQRuIggNkf6CxuOCikRQBj+yLInYATZl2J5Rx2Ao7iYDAm8liJJuy+gAoMd4CD9SwgmIQVSNSUEAEnfgJyUUjDmBICYG4f3lAnv3E78BscoAh3C9BLAMpOUEoAoJwAHYJCfYJQgKRqSgCJQOWOJIl3AyJ3DUiACclIvUJgFO4j1EthsAhIQCHfgc9g2J2CqRr7w/mCAkSPtKgtih2HBHui7kBORO5Htwfj6u1dlOhdPY7PM9x1nLcrwVt3b+Jv1eWmimY3+1oqP167ioTbaSXds6heLf4h2kugWFzDItO3LWpddUUu3RgbLm3hrrX1XdmJp4b8rk6seLj4mmba8uYrSnSqu7lGUU+ajEZ+qv128+ItQ3S6d+6mUdC6bdVVy5du3a8RirtTru37rmuup8ts6iri1oh7p1e6vaw696kt53rnN7mbX7Xm/JcK23ZwqqabpoT3XC79j1By1E8KET82ILU5expwxmcsVt3L2GzIVD7R25G0F4IJyO4kSAH2mLqhN/saeX6HuPSjo5rjrjm7wGh9OYvOlRVSr+Nt227FhNx5qmt4GViJnh6bcaoTrqq8tC3bZ7r0s6L6964Zx+p2iNM4vN/I19NivKqbNqn9s/M02t+0mxfw/fCayDTWJwmddT80WqMfbadWT21OC++Ka/0nfbTOkMn0flOGy3Jssw2W4HD0fR2rOHohU0+k8nE29msU93QToL8JjIMkrwua9Uszp1Nj6KqLlOV4WVg45dFdNdMv02fqd89F6FyDp3kVnJdN5VhsmyqzP0eFwtPlop+SP3vLHYsHEtI8CW5edwl7j24CjKSSgYuUViWJAi3LEiEggKTlBuBOwQJ9pVMoNBTn5EU+pYgTABJhKAG4ANEaLyhEL1AR95O5XIYBIi3MiQBSdvUn/8AECGASLv67hrbYJr5AO/IiAxLQQZPUrc8BBQpG4HICdx3KRsAwuCgCRA4DCcoAlAncdwvmAZFzyXnsRgZEn2C4KAJEjuUCcEhrcsAA/uJuXkTuAnf2HPBSRADj3E78FARHC+ZE4+0NFjYKPkJE3ZYaATDjkdx8yhEY7hsRsFF3E7lAAg/AdvQIcBiA3AVSNSgnIfAH82OwNnMMHewuItU38Neodu5aq3pqpahp/Y2dM+vvwvenHUt4nM9H26dEZ/Upo/Il5MNcrfNVxJOpz7HdTgrpQRoG67eETqf4eMdeq1HkdeaZHbfloz7Lqf1i417N+f9Bw/au0XafNbqlLb0Z9J+PyzC5lh67GLw9vE2K01Vbu0KpNPnk6WeJD4XuhuqNWIznRNf8g+oPo21awdK/J8Tcn8675lU1/Y+iO4szmmeGoSWypnJfW/w49Q/Dzm13DavyK8srpu/Q2c7w9D/ACW/tMpvf17djjKm5TXQq6Gq7b4qp4O4nLKYmGb+8TsYqqXsmZcqYCIJAn2AEc9tjJoj4AJtNep+voTW+oel2rcNqXSObX8hzrDtxiMNV5fPS/zqKvVNbP2Z+QY+XcYzyuZhtY8JfxPcj1ysPpfqf9Hp7UdNVNu3mbUYXFy4oSSdVXm9W4W6O/lnEW8VbVy1cpu0PiqipNP7UfNVcs03rbprp8y7dmvc7T+FLx+6y8O2IwmTZ/Xf1Zon6tl2r9c38FQuHb3SfZfWb2k4mvs1i+eW7JbSVbnH3RjrppHrxpKzn+ks0sZjhnFN63RWnXh64nyV+jOQZRw0IgTuJDe2wVSJhL3HLCHHuOUG36BdgCUEhpzyZEfzCjE/aR7svAE7lbEAgpGGE+ShAQEbcgUm6KAJuO4CkAglAQ3kAxA3XuUIggMoUJ8xG4WwD5CdwmgwHJTFF7oCk3b9CkmQCXuUjDcABwFyJ9gimM+pkTZhRTJTFP7SwBSOQ2JAIpJ3DAcB/IpE5AoMe5kQCJQUlRQ7jvIb9BHqAfOwiRythO4DgpGpDUgJKR8BBFBHLcBhR7iNhASYDhhOWUj9AKSdhwg9wHI7+wjYcAIhyJKTlgEOCNlUARd4D5kPksbgUj2DcDkByiJxsZEgCLdlhyUACTuI4CcgEG4JU/eGdNfGB8Q/TnQnDYrINK/Q6m1lVTVapt2bidnC1PbzV1UzFVO78rXKgI5s8Q3ie0T4cNL4jNNT5lTTjFQ3hsttRVfxFcbKmmVK4n2NNniT8WeuPE/nFu5nuIqyvT9m67uFyTC1tW6ZlfXe1T27Nvg411zrvUXVHUuJ1DqvNLub5riK3crquVP6OhvtRRMJfI/FXLb5NIrhjN88JTTCUJJeiL3JBV6HTNJ9i8PggAALYPYB3E9gnuZYe1ex+OsYHB2L2OzDEVq3YweGody7cqfCVK3bCx5YcuIP3tBaC1N1TzqnKdHZHidQY7z00VrDUOqi1L5ra4S5+w7ceGn4YmsOqFODz3qLfemNOV103reXWl5sTfoT3puJ+Wq3P28m0LpJ0P0d0S05YybSeS2Muw1uX9N5FVerb581ceZ/azju9mkU93RHw2/CgsW6cFn3V3G/luKpqqrWQ4OucP5X+b5q15apXobDtG6DyDQOTYbK8gyvDZZg8PbptUW7FCT8q4TfL+09gShQGvQ4y0iMcIqYL3CUMJRIdKTuGH+gA3BSJCdgDUsTBFLL8wDaZFzA+SMgifsigBUngchhMISUncfMKN7BcCA0BSPgoAi2RPMOZLADh+wkNABHuUECJEscNFRQJO42ZSSgonsFuibvgccgV7DncRsOwB8k4lhOC9ggtwlBJbLO4UmCggB7DlE3ZWtgKRuBG45ApII1BeWiBwUjCApJE7goLcpEJ3AJyIE7wG4AJyxMoLZB+wBL3HBF7GQEkE7qDICJQJCDSAc7MSEhzsAYQ4Qe6AOQhwN5Iike+wfAWxVE5Dn0C5YneACKYvZlUcgHvsUnIj7gKTsG4HYD8rUGnMs1Rl13AZrgMPmGFu0umq3foVSj7eDoB4kvhS5PnlOIzvpPi1kWbVVOp5PiK4wl2d6m635qk/ZepsT8odMhMZfOP1A6fan6SagqyTWWTX8jzDz10UO/S6bV5UuPNRU+U9n9p+A5ceh9DvVfono7rPkN3KdV5Lh8xw1z/bXQlep/e1x5l9jNXXiV+GDqvpdRiM86c36tUafVddy7l15eXEYehuaabaXmquRx24O4symns6Ud9i9xfs3sDi72Cxli7g8fYrdu9hMTQ7d23UuU6XujFcLc7ZMluGuET+INgILsYyUAZJKfX2MZgAe29LerereieqqM/wBG5rdy7GSndw/mmzfUzFScpfNI29+Enx8aR8Q+XYDKM0uUaf1zFNq/ll5+Wi9d/wDotuak9uy3NK7W88MlLvWL1GIwmKv4DF23NvFYa47dyh+qqTTOZjLuLY5fSumo3KjWJ4QPib14S5lOjOrVSppq8mFw2oaF9Vv82n6XhUqImpt8SbMcvzHC5tg7OLwWIt4rC3qVXbvWa1VRXS1Kaa5UGc+G8Tl/U+AhzsI4Cke4KAiRtySNpLyE5CpJWpEpk3YFn1KCNtEFItwgnICBwuRHdhcFDde4ncLmRG8gUj2HcVAUAm4Cd4KROWUCSUkbyE5ApI3kbyOVuA2YSC4EyAgpOGAEyUkbjhbhCd4HeBI4QU3kBCZANSEO4SggbJgNpBlBcsPcczAQD8BPoRpsyAk7k5KwEFwJHf2DQUESUkgRd2VbjhbDdoBx8hAiQEG4EiNycMKsSO7HcoE3EiJEQA7+wKTuBSTuG4EbbgIkTA4KBJ3HJQBHIhSIgdwAiAlHBQJ8+QORO/ADZhciNwgHcpNx8+QHcMNSAJx8zw4zHWMvwt3E4q/bw2HtUuq5evVqmiilctt7JH5GtNb5L0+09i881BmFnLctwtDuXL16pLZdkny/ZGofxn/EAz7rvexOkdF3buR6IVTpxWJoqdN/GxtCqURQ1KdLTnYsRlzM4cv+NP4ldVVGZaG6UX/NiavPhsbndVv6tun82tW55e7iql7RJrd+vdu3L9+9cxGJu1Ou7iL1TquXKnu26nu5YtWKLFPlop8tPp3fuZPbg0iMMJtkVMJdiwTsCuR8h9hJVx6gTvuUi5L5t/coi5FddNul111Kmlcts8+W5fj89zSxluU4G/meY366bdvDYa266pqcKYThe7Ni/hU+FhdrxFvUvWC662lTVh8gw1UK3Vy3dq+tTWocRC4OZmIdRXudPvD14WeoHiTz21htNZZXgclSVzE5zjqPordNqY81vzQrjmNqWbYvDJ4EdAeHXAYbFW8HTnuqdq7+aY39c/XP21umqfo+3DOwmmtMZVpDJcLlGS4DD5ZluFoVuzhcLbVFu3SuyS2R+pEGczMt4rEMaF5fZGW3AakNIjo2bKRcFAjiQB3ANSOxQBPwKSSgTgdhyGtgCG8ES3K+AG47Bbom/YCudvUchOR3AQEoDQSgCkl9glsIUBFJO4SgMKcBqSdxwBYKT2HcAh3KAiFJEbiZCm4SUhoi54ArU/ITuO4YFIUjcMBshO4hMoE3QngLgLdAUgmCNEFkSIYiCigECKR8hMdwo3OwmNh3ESQIjcD5gopAmHwAe8CCdvkEwMjH3ZkRyAUobhcFAikpN59hsvtAdxsyLksAOB3D3IoAyMXtsWfQATYrI/YsAORInbZE4YFmeBvPBSeoFJEsJyIgCkfsHuFtsACEyEgBQSIAEdCaLstxO4HWXxOeA/QXiJwN/FfklORaopm5YzPBr6NOt8u5TTHnn3NTHiC8MGvvDVnt/C6ny2vGZQ6m8NnGCp+ktV25hVXPLKt/Kp+h9AJ+PqrSGT62yPFZPnmXYfNMsxNDou4XFW1XRUvk9ixOHM1iXzf01010KqmpVUvunsG/kbFfFV8LPEYDE3dRdH6ncs1U1VYnIMXV5nVXzNqr6tNCiFEM13Y7AYvJ8wxGAzLB38tx1mt0XMNiqHRWmtnEpSaRMSxmuGA7hp/cCuRwBGwCEsvKIXkDx37VOIt1W7lKqoezTOznhQ8eGrfDbmWEy3Ort7UWhbldNF+xdqdy/hqXt56KnNTVKbflXMQdZo3D4a7EmMuomYfRN0u6r6Z6w6WwmoNL5lbzDAYihVqGlXRK4rp5pfsz3Fs+e7oN4iNa+HDVeHznSmNqeBVxPF5RebqsX7bf1oplJVRMNzubp/Dj4rtFeJXTdrMcgxKwmYqhflOVYi4vprFcb09vNHql2M5jDeJiXNXoDBbmaWxFRuCpdxwUKkDjgJyUACcFAnAUh/KQnICWE5DDAoJEFAEYE7gO4bDESECmK3LyFJnYcIckaApSR6CAKSIDcCdgDjkSIXIXsASgdx3DcIAkpEkRY3AR6B8CIHqAnYpE5DcAInkcka2KkA4KRlAEewbgIBI9xG8jj5ATzF5DUhAPMRMsCAI3BRsxIB8ETMiQpALdyRrcrKBEtxELcLngoRFwTsmZEfGwUnfgRvIXAYCNwwUCDuGOH6gOHJSOZ2AFIykQE77FQ2EfeAYncTHIb2CDcBKAJ3CqY1cSVR2J82EPNtJ6T1Z6xaX6L6TxWoNUZnay/BWKHXFb+tXHZJSz1nxJeJTSvho0Hf1BqLFUvFXPNbwOXUVJXcXdSny0p+ky5jY0n9fvERq7xJatuZ3qjEVWcIqm8HlNFT+hw1PZJPfu+5YjLmZiHtvi18X2pvFXqitXarmU6Dwd1/qfk8w7y7XL0NqqrepJqNmjglQkkto4Rit0WdvQ0iMMJmZ5V7uWTgbtAqDLHqQsQBB2HJjXX5ISpqrrq2pooU1VP0SAyuVK1S66mkku5y14dvCxrvxMakowuncHXgMjtNPF55iaGrVpftUvzm3DSaTR2R8Jfwy836i05Vq3qjTcyfJHVTibWQOmLuIpTmn6VNNeWpejmKjanpXSGT6KyfD5TkeW2Mry7D0qi1hsPTFNKShL9BxMtq093C/hl8GWhfDVk9irK8DRj9SunzYnOsQvNerqfKpqhfVmYXudgEtkEoZZOGglDDKR8gRFkbB8BRhqRJFMgVvkJhwAg3AYaQ5AIIJQIgKTuEyNiI7gHuVdwoCfqEJn5EaLJQqKRG47lAnIQjfkbT7gSWVIdxHuAmAxKY78gFIiRIQEeyK9kI3ABKA+BJJbAbr3D5RZ29wvcA1ISclAETkTuJ9g0ER7MpOS/MKce5SKOwkiEbyEAuCigncoVJ9icFb9iSgMichcbjkAuQ5CRSInoO4lSJColuZE7+w4KHA9xOwbAjZSRsVAUjf2jknHcA1wVbB8bkQFb9h6hCYAmzLME9i8gUx5ZY3CgBuuRyhI7EDgbsL3ElE8pkSQwDUhrZhv0EgExO4jccJwASgPcFAi2JHJkYx7gWNglA4KESdw1I2RSKxgsbjuIKhUpR1x8Ungi0P4k8oxN/EYS3lOrVT5sNnVheWtVrhVuG3T6peh2OkNAfPv1/8ADfrjw1apWVarwNd/Lb0vBZzhqG7OIpUT6tNSlvBxg3smt0900fRtrfQWQdRshxGTakyvD5tlt9OmuxiKZpe0fxmpvxZfDb1B0dqzLU3TynEal0snXibmVqmb+Dpl1V+WEl5KVMbtxSdxb0ZWp6w6XPgxMbd6nEW1VSo7NNQ6X6MzO2S8MiAQAv6SclkCVLzeyP2tB651D0s1Vh9SaVzK5lWb2KlUrlptK4l+xqjlOX95+NyRqZYWJw3S+DHx2ZB4jchtZTnddrJNeYO2qcZga35aL74dy1zFLbiG5O2VLlT2Pmuy3H4vJs1wuZ5bi7uAzPC1q5ZxVlxXbaNq/ga+Ifhepl/AdPuoV63l2qkqbOAzG5XFGYvtTu587c9koRnMNq2y79SmUwt1qqmez4fqZnLRG4EiJEAJEhobAT7SpiJEAH7EmPcq4CUAE5ZHzAmGX3CJA8pZAUgMPgKe4Bbdyd2NioA3wHwAwCRSSO4BjhBbrcJyBHMFXAYXzkCJxJWNmR7AWPUTPA5KBJgB7juAjbYbpATC3AIOUUgE9SxwHsvUTsEICUFAVjuyp7epSewBuCNblgdwiPZlTkNjuFHsUmzEwAUiIkjUFbaAe7EjkNSBSMpPcAEoC3HHcCdzIkifQCTJX6FAEZSJyNyBESwvUpGAmQhBIclRWpEwRcllBSUNo9h33D4ALn2HDgkKJLPoBG/KcGeKXxX6U8MmkLmPzi/TiM5v01U4DLKN7l+522lbS1Psfl+Lzxf6e8Mmk66rtVOO1Ni6HRgsuttOrzNbVVLlJNp8GlLqT1K1L1h1ljNT6sx1eNzG/U3RadU27FEtqmlcbTEwWIy5mcP0OsfWXVPX/XuM1fq/EuvGXqmsNgKaps4K3vFFC7xLUvc9MSgvb3DSk1eeZyJwC7QQIBrcqcCQDRVv2MW43bhLuzl3w2+F7Wfig1O8Jp7DvCadwtapx2d3U6bdPrTbcRXVutpWzJnCxGXHeh9D6g6nantad0nll7Oc4uf7RZplW1MeauOFMG2nwbfDwyDongMJqPWdu1qDXF103m7n1rOCf7S3x5uzfmXJzf4cPCxozw26TtZZp/A0XcxrSrxmaXqJvYi5+2lt+VcbJxscyp+hnNst4rhjRbVFKpppVNKUJLZIzXqF7FI6SfQNDuFyFRvsVLhidxIEjcvKDUiQI2VepG0XcBG4iHJSMBzO442Q+QezASEmGhPqBG4EyWN5E8gFySA+SwEBwxMCUmFOUI9xyUIxXcqaJO+xYCouStwJ+4JyBONyxvyGH+gBASgn4F7bAUx77lmAwGwj7A3ATbIHCJM/MvEkkqL3RJhmRE5YUW+5SdyhEgj5KxxsFO2wW6CaQfACBwT58l+YDuR7FjdjggKYIoMidwD3cE4ZZ3KUThCUykgIk7lSgRuGFE5HcTHIRAe4jYSGURuPkXsOR7AEHuFKEzwAey9QG4C5CHYnb1MiBU49w9kVAB25C9R7CQEFIhyAcEW24agJQwHKLwvUjke4F4ewjeQ3BJ3AqJG0FSgJdwHHBSNwEoAcMRO4YTAPgJhjgByw3CDZGtwHm2KmSdirgCT6F5YaHHAQgwu2aLtFVFdKrpqUOmpSmjNhhXQ3xjfDayfqfbzDVvTym3kerpqv3MGn5bGMfNSfLTe8JJbs1Uao03m+iNRX8h1Dl17J87sVOm7g8RT5al8vuZ9I7UI4G8UHhA0X4l9LX8LmeDt5fn9ul14HOMPQlds3fVw15k+PresnUThxauWiIyURByH128P+sfDjqerKdXYGqjC3LrtYXNLSbsX/AE+tCScJ7I474e7NOWExgL7okzuXjkISg6iTI4Aq9Tx3LPndNdNyuxeofmt3rbiqir1TM5gyn2A2VeBH4iNeOpwHTzqli1RmFHlw+XZ3c2WJXCpuPZKrdJQuEbJ7N+m/bouW6lXRXSqqalw0+GfNXcpf1WqqqKqXNNdDiql+qa3RsE8CfxCL+lsVgtA9S8bVdy67UrWAzi40/o+yprbhJS1u2+DOYxw3rb3bU1V7FnY8GDxljMMJYxOGu0X8PeoVy3dtuaa6WpTT7po83PzOWizsSNvcqG8gRSi8r0IyzABCQkPxCDUjfgbiJCkbCNg9xEhBKBID9ApBO7LI5+QQRScISFHsymL2ZUBEXhBCQHYiHIXMAX5DuHvsPkAjcNwFIkA9hyhIkAiVFTkbSBJZXswygCPgoAx4K1I4HuATlBc+4mXAiAEMQE5DAcjjuIUkcgVQUxmDICdww13EgUncPYPfdAEoElIwCUBheoqQQ7iBHcJyFGNww1IBFJwJ3ASGISJEgX8Ck42HcB3ZGiwTzAEO8FXqRsA2qTr34vPFvp/w0aLvXar9GL1PiaXTgcBTFVTqeyqqXZJxyu5/X4sfFfp3wy6Iu5hjK6cZnl+l0YHLrda89yuHEreFK5aNI3UjqPn/AFe1ljdUanxleNzDEV1O2q2/LYob2ppXbaOPQsRlxNsMOovULUHVjWOO1RqbHV43MsVW3TS39SzTO1NNPChQtvQ9f8u5IjkqfJrwwnyjUDkFCCQ5HoSe0gBcrpt23VW/LSu547l9UOimm1Xeu3KlRbs26XVXcqeySS3bbNhfgo+HDitTXMBrbqnhXYy/6uIweRNxVUvzqarnr+x+q16okzh1FZlxL4N/ANqDxF3rOptUWr2S6EprX0Sqbt38Y094W1SpiGquGbg+nXTjT3SjSWB03pnLbWW5Xg7at26LdK81UKPNXVzVV7vc/cyzK8Lk2AsYLA4e1hMHh6Fbs2LFCoot0rimlLZI/rh/YZZy9ERgXCDUsJ8klsKsfcG4KTuBSbIcEhIIsbhBCYCqR+obhh8BBoLZBcDuFRrcrkc7CYAcIdtybtFjYBIfYQhsyA1yRSWd4HrJQUjeAicoCgJKSPYDIj3J+xKnsA7BSA90BGjIi25DiAE7lJyHuEJ7DlbDsJgKIe5F6dipJgORO4eyACN5ESGh6ASC8jvDCe4BKPkUE3QBqURcmRPcBEP2KSZ+Qj7gDHIjYewFJO45YYCdw02OwfACBHqIExyEGG9g3AidwCG8DhiEgp23HO455EbARTyZGLUIoBPkJyI7k+YCYKhy4YgB3KRcB7bgJkPdE7yVP1ARwIjgMP2ALcR3I+dhDAcjvuVBqQJ3MidxEboA99h9glwSXAFTkfInCAF3HHITkTsAfAZFBW4YCHI3n2H2lIJwHAYfBRSMnI5AyJ8ybJhuUwMgSdggD2HYpGgEwtw1LI1sZAel9WekWmOtGjMw0zqrLLWYZdjLTt1VOlK7an9lbriaH7qGaaPFl4JdU+GLGXMxw9u7nmiKqnVRjrdLruYamf8AbEpaS9WzeVB+fnuQ5dqXK8Rlua4LD5ll+Jodu9hcVbVy3dpfKqpezRYnDmYy+bil010U1UVKql7qpcMSd2/Gl8PHM+kmMzDWPTuxczHSVyqq9fypTXdwje78vrT+c4S22R0gs36bycJ0tPy1U1KHS+6a7GkTlhNZh5AizvuRuCuSSx3REGBe547ltXafLVx2a2a+XoZhbgd6fAf4/sR0xxWB6fdQsXcxOmr1at4DNK067mGrqcKit8+XelS3CSNsuBx2HzHDWcThb9vE4a9Sq7d61UqqK6Xw01s0fNfXapuUumpJ01dn+J3k8BPj1x3SnMcJ0+6gYy5jtJ4mtW8tzK43VXgqnt5a25bo2pSWyW7M5htW2fEtuoPBg8ZYzHC2sThb9rE4a4vNbvWa1XRWvVNbNHn4OWimMTwZEiApzuRyWEiNIDIkbyFwUCbjeSRDRkBN2gkOURzIF54CW4UE7sCsdhxwUCPgFJG4BhMJR8iLkCsCYDUgO5TFbsyAGL5LEBIgfME3krKCJHoV7EWwFczwGUkQAUoNBCYAL3DcEa3LGwDuO+/I3kkStwKI2Dew5aAP1E7DuAJszIx4ZWAjlkmYEssbgR7MqInuXuEG4HPBPsKnIFJyUkBSdwxImQgnsF6DkcIKCdgnIW4DZhcDtKC4APdANBAGUnzJwuQK9kcLeKPxPaY8MvT/ABGdZzfpv5ndpdGX5ZbqX02Ju9kl2XO722P7fEr4kNM+Grp7jNR5/iKbmK8tVOAy23Ulexd2NqaZ29942TNG3WTrJqrxBa+xWr9Y4uq/i626cHgvM3awFpuVbtp8KZf2liMuLW7X8/VXqpqXrhrnGar1Xi6sTjb1dTsWN/Jhbb4opUuOE37nq0uQ39wbNMMM5R8grEzxwVEgLYq+Q8yXsA5ZngsHi80x9nAYHC3Mdj8RUqLOGs0uqutvjg82UZPmup86wOSZDlt/N87x9xWsLgsMpru1Pj2+829eCTwC5X0PwOH1Vq61YzfW1+mm5TXVQ2sGmvzKZ3T4n3RzM4d1rl6D4Efh32tIV4PqF1PwdrGZ9FN3LcouKaMH3Vda3Tr2paaexsQShe4ShJFaM2+DdBOQ0IQVSdx2ZE9udwMiPfYoIJythwOOQt2UJ7lIUIk7h7DZMn2kVeR+yZJhljeSoFJwUKncpIAQSgJQUncKJiRw5GwQnccMnLKgpG5Sdw+ACh8CIHPsAElI0I+0IkyXZCIYaIolBSLgFQgpJAVJ2gq4EITAFIpEyEoApAwtwDEbQJgTIBbBKBwSX6AXhyH2EShAD5DcTA5QFI1IQbANwBEsAUiciNglAQncpNmxwFE5KSdpgkzAFncPccdg+eAHcpORG4BOSNovBI33Adh3RRM8AGpKThbFAEbAjcA04C3QKBNg9kIn5FAxj0KkF6FAxjcyIUASd+A5DYCdxO4EBFJIiQ0ATkpEJCpKfJe4gPmQIoZfwAfzATsSCpbE+0IoTAhBTeQ4QYYQTQncBICkb9gwFGGpHcSEJ7Dh8DZDkK8OJw1vF2a7N2hXLVadNVFXDT7M1neO/wCHXXQ8b1F6U4Gmi5Qqr2a5BZUK8lvVdtLZJpeZtbtt7GzeNjGqlQ+87DKTGXzUt1fSV0V267F6h+WuzdpdNdFS5TTKvc2q+Oj4e2D1zh8frvp3hLWX6jp81/G4CzQ1TjNpdSS/ZfnPd9zVVfw+JwOLv4THYe5gsdh6nRfw11RVbqXKZpE5YWr2rBC8k4OnCcF7laJAF5RLtum7Q6K15qX29PQvAnYDvx8PXxzXdC43CdNde46q5kdfls5TmF5y7D7UVP8Aawvbdm1nD4m3i7NF6zXTds1pVU10OVUvVM+au4vNTExDlVLlNcM2S/Dv8dtVd7BdMOoeYNYp+W1lGaYmv6t5drbfPm5foZzVtW2fDZohJ46LquUU1UVKqipSmu55OeDloNSxEiZ+Y3gKLYPZyHuP0kBORO4SBRQAREbD4C+ch8FUQbC4JIFjcJyGpY4ApJDYXADkpIaABKCkXzKAMXMhboqmQC4D5E7iNwJyysQGpAcjuOB6dwhG8lAAjcFJDYCiHDkdxADkpOCkEW6DUh7QNwD+8InA7lRkRopNwHz5E+ogNSFG9idvQsB8ABJO6YhAVjgc/YUggiUJ+4pRCb+hXyUIgkNk77hSdgnHJe2wnYCNnoPW3rLkXQzQGY6oz/EUWMNhrbduipw7tfFNK+1r7z2DXGuMm6d6YzDUGfYy3gMswVqq5cu3KkphN+VTy3EJepo58XPixz/xUa+uX667mA0Rl1yqnK8sVUK5u19NX3mpeXaWlGxYjLmZxD1PxA9eNQ+I/qLjNV5/cqosOtrAZe39TCWp2pS9d2t5OOoUL1DckNIeeZyridiLccAqDhFgkSHwAbS52P6shyPNNYaky3T2QYC9m2e5lcVrCYLD0+aq5U/b0hN/YMhyLNNYagwGQZDgL2aZ5mFxWsLg7FLqqqb7tLeEt/sNzXgg8DuU+GrTdOc56rGb9Qcwt0vG410qqjCcfrVl+ianzQnuzmZw0rXL+fwN+BrKvDdkSz/PnRm3UDMbSeKxVSmnBp/7Ta2W21LbamZ3O3SXlUcmKUbIzgzbcD9QwnJJ+0CpyUAGU5CEAKSJfoOHIjcCbsq4DcBbMCkbgpGpAck+aLKJyBYJD9SuRyAXuHsCNbAVbse8BLuNwDfsUxclakIjLuTgTIUXDEwOAkBZDY7E7oBuuxQnIYDuRuCyIAm72LvIKAJO4EhE5Y7b9gufYoU43DgQR7gWNvQbjlCQD4C2EyEAY+wcCdpATK3DlkSlFYBcwJC3RGmQWAnJN5gq2Kik+Qe44ASJEbk9QqyAt0HEEDuH+gIModiLkyJABSO44RQMVyUnBQJM9ilI13CGyGxJlou0hUj1K/0hqRsgEyRvcvA57ANykneCgTj5CQ1IjcIShIgRAUncCNhM8gJkiXsPzSz6gEGThlkAmG39gTkbhDlDdcCPsAUl+gTnkNwhGwBcjaScMrmeAA2E9gkBSdxOxE9wK3AXzKQCgjYRAE7h8CCik2kNwAEy4EQOEJlAUE/EoHjrpVUpqfY6L+O/wEYXq3gr+ttDYajA6ww1DrvWLainG0reGt996ntB3rgxroVVMNSu44SYy+bDH5fjsnzPGZZmWEuZfmmCrdrFYO8ortVrlNHiW6NtHj48COH6r5bitc6Jw9GD1bhKart/D2qYWNXo/eXOy7Gpi7bvYXE38LirNeGxmHrdu/YuKKqKl2aNYnLC1cJ24Jz2K1CI9iuCeC7P2IAK+Dw37Trdt01VW7lNXmou0OKqH2aZ5YAXPq2jfD08fH8mmHwPTHqPjKLOpLFNNnKs1uuP1QpmFTW+PpJaSSSUUmxClqD5q7N6/hMRZxWExFeExmHqVyziLT8tdupcNM2//D+8a2H63ZDTo7VOJt4fWeXW1RbprrXmxdqlfnriYXlmF3M5htW2XdZtLcpjP2mRy7SPsEQHuOwDcm6ksh8BRMPcjKgD2G8k3ZkAJG/AbgPZAUEE7EE7mRPcpQJBSbwEIEpj8R3iCKSoEwEUogbgNCADKRqSLfYA5n2KO2w4QAIkwpKnAFBJ3AFIxG4ncCgkhuXAB8EliZgsAJJ33Kt9ygSZ4KRMPgA3uG4CQ5AclJAbgBPbuSGVcCJQB8BIboICghQBEoCDARuHsmByQYriTwZjmGHyzBXsXir1GGwtih3Lt+7UqaLdKUupt8JI/obj5GtH4lXjRWHqxPSXRWN+kxV2j/NjH4etOi3Q/wDalUuXVS2nD2jcvKT4cL/EE8ZdPXrVt3RuksVc/kKyi75b+Lpmj8sv0uKkvWmmqlw5hpnT9R8l2S7GFq3RatU0UqEv0v1M+xrEYeeZyTuFsXtsOfmVyOohWQCvb5HmyzKcw1Dm2DyjKcJcx2aY25Taw9i1S6nVU3EuOymWz+W7d+ioX1arlTapot0Kaq6nxSkuW3sbWvhzeCirQOT4fqTrfB269RZjapuZfgriVX5LZammpzxU1VuoTUEmcO61y5C8B3gky3w7aao1HqDD0Y3X+Z2aXir1cV04Rc/R252UOfrKG0zt5BYQifkZN8YEml6mROwTkCPaSpQgnuO4VOC92TZlT7gJjkTBOX7FakCTv6lZI9SpQA5FXBScgRbMsyIEQQIERwGpY3KAiCgDHlj0LzI4QB8EjYfMvKAJxsIkLgoEewn9JHuVbIA1IY7bEmUBYbCUDvIkCbovKI9ipgIHbYpICEh8CEIAi2YezEyFuFXYNwRepU5AjK0IKERKB32Ejf7QqfiEtyvgie4F4Q4D3HIRHu2VOBLQ5W4U7j9kglBJ3ArCQYkA9nI54C4GyCC5ZSQUATbgpOSKRuIgSGUEthEBLYkKQLO4kRJFswK/UJQibvYoQYQgpFTdMNbyGEUFJJ2LO4j1AkwZESTARSPlFIgo1I3KRqQgtib/ADHLKuYCo+xdkhyGAcDfuSEVuAHKJEQWID3YBk4ZfmH2Ac7iYCch8AH6FJ7lAxRkSYEgUE7bhrYIky9i9/ci9BDQUW5kSkjAyJEsLgj7AFvsWIYS9RO4DllIlBFuwKykiQ90AhIKSPgUgWSPdlgoGDoTpaalPsa3fiL+BevM7WN6qdPMB5sysUVXs4ymyv8ATFPe5bpX7L81eVI2Sdzx37NF+3VbuUK5bqUVU1KUxlOXzUW8TTfmKaqXS3TXRUoqoqWzTXbc8iq5O7nxHvBxiOlmo7vUnSWWOvSuYXP808PhaW/yW6+KlQuKYpqbcJb7nSKmumulVUNVUNSmnOxrE5ee0YlUBMlmCuUC2K0OEAg/s09n2baM1Hl+otP4yvLs7y+7Tfw2Ioe3mpc+WpcVUtpSnsfxJv1K23twgsThu38EnjHyzxNaMt4TMPJl2t8utqjH4F7fSwo+lo4nzeV1NJQpOzyqk+dLpf1S1F0a1vl+rdN4l2Mfg619Lana/aleeh/OlNL0k3qeGrxC6e8SHTTAanyPEU/TtK1jcHU0rmHvJLzp08xLhVRDgymMN62y5ZTkyJG4ZHSNb7liSkSgKQRrcsiQC9CkjcoQI+BBQqdtgnJSbQECQ/UsbFChO5QERKCkjcPcAhG4SgnIVY3EhbBbSAQiF7hIoERQSdwKRwGPYAJKSZAdguAuAk0BFtyJ35K1JI3ArAmGN2AXAjcbr3KBPMIJOxUASgLngTuUARlMZgIvDDcCQnIVPmFwysAIEQJkbruAaJxwWRw/UB23D4E8ycT+JTxCZB4cemOZapzm6qrtu3UsHgaKkrmKuxtRTPd78+gRw54//F/gugGgrmQZLjKbuuM5t1WsJYs1TVh6Gmndqa48rdOzabk0zX8RexmLxGMxV2q/jMTcqvX71bl11ty2/tbP3upHUTOuruus01jn96u/mWY3HXFxy7VHFNP3JfceupM0iMMbTlYkJll8ER0zBO5Y+wk/aBZ2kkw57er7B1JfI916LdI84689TMp0TkWEv4ivF3E8biLS+rhsOmvpKqn7JyTKxGZdkfhveE6vrZrt671LZjR+S1/0Lhq6N8ZiKW4qVXEUV0JxG8m46zZpw9um3bpVFFKhUrhI9S6S9M8l6Q6AyfSuQ4KxgsDgLFNDpw9PlpuXIXnuP3qqTb+Z7hw5MpnL0xGCIDUbiSLnkKqckjsUfiARSJQGESTIicsoVjEyVbbCSNkF55KCdygwmG4E9wDJO6KoDASykbgSAa9A1JSMAth9gTkLlgTgq4HD3HIDvJTHhwXuAb9UGthuwmBE2VOQygROSMrcP2GzALgQiSywAiREBjsEE2I3DXuAowuA9kE5ANDdocdwgJ3K3AhDuQFwO4YgAHuOAihBEty7t7BIBBOA5XcrcAEUi9RO4RSTuPUoAkSOA3AUSgoBAI3AncpRjG5UkG4EgEN59iUmQEb9gh3DApN5KAI0I/QG9hMAUiKR7AGpC3Q7E3ArCUETMgBJkMoEW6CElCJEsJ7wPkRb9wq8AACcsyMV6FATuFIj7x8wBQRhCQhyh2CkpiNxHuE5AexIhlbgTIDlDgPgLgAuQwlHyE7gSYWxVyxIbAcvgTvBPtK+AI0WJEDjkAtiIvO5QJG5SEiXyBUoHIRQJxsIKAAJ3KB+bqDIMBqfJsZlOaYW3jcuxlqqzfw92nzU3KGoaa9DSP42vCVjPDNry7i8ssXr2iM0uVXcNejzLDVurehvspq242RvJ7nqHVXpXp/rLofMtKanwVGPyrG0OmqmtJu3XDVNymeKqZlMsThzMZfOqntMpmRy94ovDDqPwr9QbuT5lTVjtMYuuqvKs4ppfkro5VqpvfzUp0puIng4hneOGaR5eeYxOF4J3CZWiofYRuQ9i99gJ24OYvCl4lM08MXUvDZxY897TmNros5pg6Xs6G2lWv3vmdT2cwcO/MjUpqNns/kFicTl9HGgtd5J1J0pl2o9PY+3mOUZhZpvWL9D5palSuU/Z7nsHP2GnP4dfjD/AJSurbOgdU37i0hm13y4LE1VfUwV58+b9y0klC7m4izeov26blutV0VKVVS5TRlPh6InPl5BMiewTkjogQhO4QFBBvwAKThB8AHtuIHYdyAg99hvIbgoRsH2CEyAnYQHsUCL1DKTuAgPgDv7AOUG4EhuVsAnYBOQnJA3E9ik3n2KCUFJ5ihEiPkGpC9QFIkpGvcJgHyikiQnsAbgnMlf6SJSBUvUpO4bgAJgRI5AJiAlAncAlA4KRgGh2EyGEEOQhwFOAvcOJJU/LuQfmak1BgdK5Jjc2zLEUYXAYO07169ccKmlGi/xh+KTNPFF1Nu4umirBaSyquqzleFne7SnP0lfbzS6lt2g7J/E78XOOz/O7/SHSOZPB4LCXHTn1+zUvPd7Ow+YSflq2hmvii2rdKpXC2SNKx6sr29IZJ8EX3Bh+x2xWPtCmdyTsAK+CfgXZ8nhv4ijD2/NU3MxTSuan6IK/uyrKMy1JnGByTJMDdzPO8xurD4PBWVNd2urZJfabuvA/wCFTDeGjporWLpovanzXyYjMMQlvTV5XFH2KqH8jhT4bvgwudPcrtdStZYL6PUWY2k8FgsRR9fCWm+6fDflTXzO/wBG2xnM5bVrgSgyInJN2zloeUuxSRv7ANgH6BKAEjv7BKAnIB7cDsH2EbQBNx24K0SYAqCckmGVKAKSAnImQD2HdCJEbgTlFfsGlAS3kA3DHYkSVT3CGwXIXMEmGFHJeBO4e4Q7hz2JG5kFR8jgNDlBEfOxWSIYXqFOeSoRuOAAYakoRJG+5PmWX2CpDZY9ykiQgO5KTIKxaLOw5RHswHaTIkbFAi/SUkbjkCkTkdglAFI5KSYAm7KvvG0k4AswOZES0wu4B8Ep5D3LEcAUkz7hOQgHJOWWdwAj0HCCDUgBsUnG4FMd5LPBQJvIlB8BIgpGG+w7blE+ZYIt0ZACd/YpGpCCciRwGpCpMMse4aHIApAt2AXoyk4YakBtIe3AiAnIDgFAREofIn7idw1CCi2/8Sx6hKUGwExwCcFkBEBFBBIHCKCiRxuJDQiABSIIBEiIDkTLCCUB8BKBG0EVILv2AiCiJyyiNxG4BIpJ3gQA2kRHAgNwBTHuZGPl3AvJScBSBQTuGAmAuQOHAHGXiC6E5D4gunuP0vntimqi7S68Pfj61q6lNNS+2PuNEvWTpHn3QnqPmOjNR4e7YxOGfnwt+5TCxVltqitfNUtn0TNHXfxo+FjKvEr00v4ZYa1b1Pl1NV/LMdTT+uUVwm6ZXPmVMQ55LEuJjMNGKUl4P7c/09mukNQ5lp/PcJXgM7yy67OKw1xNVUVLZ7M/hlNe5rDAcocMsfaRsIAsT8yQBjdTqpUN01JqqmqnmlrdNfabafho+Lq/1Q0t/K81Xet/yS5Jappw2KdW+MsKEqnP7OW+IUI1MQfraO1jnXTrV2U6p07jbuX5zlV5X7N2y96o2dLT2ahvk5mMw7rOJfSBS1VunJTiXwx9fMl8Q/SnKtT5VirV3FVWqaMfhaak68Ne3XlrXZtLzR6M5ZT3MnoV7dhO8FJG5ROPcvckIvCAL3E7+w5RFs4AvJSCQKRoTsEwHeCmMyVAUAASdw/YPcTvAFBO4bgA/mT5Fn1D2QESaKFuhG4ApICYDYJRI/OCcgUnATkNSA7+w2EwEQOWRqO5eBHqUJQ3knDLEcARMyI3AYCN5Ebk5KlAB7DljncNSAbgciAA4KRqSkE4DGyDbRQbg6oeP7xX4Tw+dM7uV5ZilXrLPKKsPgcPbSqqtJpeautfsV5XVDjlHYPqj1EyrpVobNtT5xfos4PAWarn16lSq64flol920l9poN649Z866/9Ts01pnNVVCxNTpwODmVhsPLdFPu0qmpiSxGXFpxD0fzXbt27fxV65icXeqdy/iL1TrruVPltvdl8q3aZOXuJ2ZqwQrQXACIPtKlJiuQFy5TaoqqqflpSlt9jvP8ADa8Hl3qRn+E6n6uyyujT2X3KbmUWcRR9XFVcq55X+dTu13Uo4W8F3hbx/ic6nW7eJw9xaOye5TezLEuaKL0OPo6KuG5htJ8G8nIsjwOmsowmWZZhbOCwGFtq1Zw9ihUUUUrsqVsjiZbUr6y/usWqbNqm3RSqaKEqaUlCS9DPuEEcNTnuI3GwjbYCk4ZIewXPuBU5kclI3ADuGvsKRqQIm2VuAlDADkP1EwRzICdzIiAABcbjgBMz6CUI3knLASipyNmhwA5GyEyh23ARLKAQYxLLzug57DjcoRuG4EblAEneAlElCBJ3CUSJ3IpO4T2D23KURIP5lI0AW5SIfMAnJOEVuBCgAimKlsrATDEbkTllbhgJkcopJASEJCnuAYQbDXABhtByEwHIW47hgOOAv0h8BcAFuySw9mVLcAuNhwI3KETZjnYpI3AQUm/qN4CkbiJEbjgCkiSkbgAuWJDf3BMBxuORI5QDkPYLgN8AORBI3ksuQKROQ3AakBG4JuirYBwJlbFJEAFsh5kHuUIi2CDKFTuUncoAj2KRgJA347hJwADUiYEwAgTAQlIByEo+ZSPZBDsOCk4QUY5RSMCcdyrgLdhv0AT6DlkW4mAK0FsN+QnIRI7diopONwo3AYSEwAXAfoUATuJjkpim5AswwpKSAikmfkChWKgyJsggEkq7GRGpCOinxHfBlZ6sadr6g6UwTo1jlVDqxFGHX+nbKX5rpXdNtzDexqQtXFcTaXlqpflqofNL7pn0sXKKblFVFdKqpqTTpalNe5qI+JX4Rv5Vuqb3U3SeW1W9OZtddea4fDUN0Ya6/wBmqFtRRCpWySlnUThnaufLpDA4JTX5kmmmmpTRk+UaMRITA7kAc7mXHYkRwJA7BeCTxN3/AA19XcJVi66Xo/O71NjM6a63SsNLX69Su7VNMRtybyMrzOxm2Aw2Mwtau4bEW6btutd6alK/Qz5sb1m3ft127tPmoq2qXsbQfheeLSjPsu/lS6qzC7XnWBpdzKb+JbavWFvUncfNSdVKSlv0OLR6taT6S2MpQJ3JLCcs4bCLOwakoEQ7h7kWzArcCUw+BAQgKCmPAVfKIAj1ARuG4E7lAnmQcAAFwGUncCLcsyIgktgXeREkezMgJ3DQb3RQiIcdwtmGpCiHIbE7gG0RIyJwAki3MiIAlBTGGVAG+wSgSJAPb5CROxNl7gXeR2Yb2C4IInCK+xPKX9JRTFt8FjuN0AfBjcrVFDqbVKW7b4RlMo6o/EE8Udrw/wDSe/l2WYu3Tq/PKXhcDYW9dNur6ty4vR0qpNMI6V/Ew8Uq6r65/lc6exVyvTeSXPNjr9ut00Ym/wAO2138lVPvydKufT5IyruX8Rdu38ViK8VjL9dV7EX7rmq5cqc1VN+7I9jWHnmczkXJHwIkFcklRCrkA5R7d0h6UZ71y6iZbo7TmGuYnF4q5S8Tdopfkw9rmqqqrhSlVEvk9SsYbF5jjsLgMvw1zGZhjL1NjD4e2pqrrqapX6Wjdb4CvCfb8OHTf8tzWxb/AJM87opu5jcpX1rdO1VNlvv5W6vbc5mcO6xlzH0G6K5J0C6bZTpHI7NFNnB2qab2IppSqxFxKHcq9W/VnIgRTN6E3S9CrgDlyAfATEbySoCxLJ3K3AkIRwEFsyRyRV3DcMcwg1vIBORDklJUoKEskmQCJI4Y2kSFJjkJyIkMCkncLZFAiclIg+AHBJZW1AncBPBSNbjhANwyJsNdwKgSO5dgDcDlBsLgB2G5F6FQFJP3BqR2AJyUxRkBI2D4BQJtwIgdygTvyHDYgMBx8hzwUj4AKRG4TH7IAn2HHJI2CAvMCJEhAJ3DQc9icOQKnIfvwRfcVgPSAxPYMgnJU5RTFcsCqQ+wQ37lFI3BSRuEPcP0EiJYUgJyx3JuA5liSpbBKAIu8FmA1IQCUg5RFyX5AEoKY0mQRi/ziwGuQtkFNxDXAbEcAJHKHcP2ARHA/EJCJAnBkTuUIEDIm2FI3ZeNgUASdybsvbcISEoKYuQqtwNwlAnkCkQTkMCkZSLYBO4nf2HyG4Ce/YTsOA9wHb3CUAoEkLgLbuUCOQiR9YsQA3kciIQWyAcD5huAlADjYTJQAI3AbEkFJ3DBQgRIAFBIkJQwEwJ39h3HAA/E1ppLLdd6XzLIM4w1GLy3MLLsX7NylNVUv1TP22pgjfIGgbxUeHjOvDP1UxmQ43D1V5BjblV/J8fSppu2pU0uOGqm1D9DiL7jfB4vfDLlfiZ6WYzJbvlw2e4al3srx0b2ryT8vm7umXukaKs80/mOks+zHIs4s1YfM8vvVWL1FVPlmG0qkvRxP2mlZYWj1h/IlISKt90RLY6Zq9iclfBIkBsl6n6GmtVZxoPUeWal0/iPybOsqvU4jDV1Jululz5alKlN9j88T5d5gcr82/Xwrdfst8RPSLJ9S4S7b/LfolZx+HprTqt3qPq1t080p1KpqexzCkaNPAT4j6/Dr1mw9nGKurSupLlGExlm3WqFRfb8lq429oTqbZvFweJtYzD2r9mum7ZuUquiulyqqWpTRlMYeiJy8/4DhsDcjonYpJFQDuTjgyJ6oApaEhcDyhCSkKFCTuUEEW2w7gQUE92G9wAKTuHDHADhiJD34C2ARBSPgJeoB+wTkcfIJ8sAwx7hbBAINSUgk7jcRBSqjEQUjAOPQNIpJRA9NhCHA7FBod0Rt+hUAmQhzwPkAbEwp5Ev0MW47bAfk6r1Pl2jtO5jnea4mjCZbgLNWIxF644VFFKlv7jQl4luu+Y+Ivq9m+q8VcVOX2rlWEy6xab+jptUt0+dT+3SpbO8vxWPE2stynB9JNO463+qGPf5Tm13D1zcw9qnZ2a12VdNyfsNY9CVKppSSppUKDuserK8+i+Xygr+4iO2JOwDEOABK7lNqmqut+WlKW/YrcHN3g88N+O8S/VzB5ZXg7tzSeWXaMRm+KdL+h+q/NTZqa486VSJPhYjLtJ8MTwj15ti6erurLH6xT5rWT5dXRxu1Vdqn1Xlahm0RUqFJ+bp7T+A0tkuBynKsLbwWXYKzRYsWLaimiilJJfckfp8oyny9MRghDgQI9wHcpOBIUmQ/wBIKETfYQJj5DkKMPgpJfoA4QTkSRqAMgSkoEn7hIfsO4DhiN/YNSJAdxElAEkd9uBEiIAKSOZKwnuAgMdwAmVsEAAfsBshyBSbFI1IBjtsEEoCJMD8AyvgAuBGw5fI7hSUGIKBIKCLjggcEl+hUylET9Q+4YXyAdtuQ1K9xumHwA7e5O4hljcAuCgicgR8l+wCQE7EjuX7BO4BQxyO4nfgBAkN7iI3AT7CAnIQBuAlPImRKAoJEh7ANikiRIBwO4hMdwElJx2kJyAfzgm/rJWOFsAj7xEcETl8FTkAp7iRMjuAjcoJz7BDYpIHyIqP1gsyIklJRZJJkTvwAjb3KRFCI/mSI9yvcL0CnBQRgI3GzG79hEAOAhElAE7biQAiB2Aa2ASUncMBECQwvkBOWWQ/UdgHdMSOR3AiRQG2gEblIO/sAn7A+OBAXAQfzEbBQUKkQOdykgBEjdCAwG8e4ZSQA4QmSNfaWJQBKCgxh+oFWwgn6TICSIEFAxdCa/jNdXxP/COtR5TV1Z0pllVzO8uo8ua4fCUrzYixzVdr9fJTTH2mxc/kzPLMLnGBxGCxlijE4XEUO3dtVqaa6Xs0xnCT5fNhav03KaXTvTUp+T9DKDsH45fDPd8NHV++8JcuXdJ5/drxWX3b1Kp+juN+a5bUbQqq0l7I6+b/AGmsTmHnmMSrTgfbuT9I7lckbl/iHyJ3A8eIw9OKsV2q4aqXfs+z+w29/DI8TtfVfpzXonPbtf8AJHpumm1RXcr2u4aPLaVK52po3NRTW57p0S6uZl0I6sZBrbLa3TVhLytYuhVNeexW1TXtw4pdRJjLus4l9EEyWT13QOtcu6iaMybU2VVOvLs1w1GKsOqJ8lSlSexIybkBFJ+AFI+Ck4b9CKIN+g7BIoRJFMmRGAncTuEg+AGyJv3LsIkBtBF6FhCO4QSgjfYyIFOOwTkIoEYQe/YJ7EB8BcBwOCg9hs9xGw4QBbiQGgC7lJIS9OAhIakpJIpwIHLgpQI3A3RQBFxuJKESNhKEbEjYDI9D619Wcq6KdNc+1jm9dKwuVYau/wDRN/WutKfLSu7foe811eVP1NU3xWvENTqnVeXdK8mxNVeAy5/lOcqn6sXk9rcrlOmpOP0CIyTMQ6Qa/wBd5r1S1zners5xFeKx+aYiq55rih0202rdP9r5fuPwmoJT9Vb8cJexTbDzTOZCrZjjknPIQY/SA/LTS6qq1RSlLqb4Cv6MqyjMNS5zl+SZTZ/KM4zK/ThsJYXNVypwtvmb3fCF4dMu8N/SPLsjsOrEZpiaKcTj8VcoVNdd2peZ0uO1LqaR0v8AhX+GGrNcdiOr2ocLbdlUuxkti7Qq1VS39a7v+bUqqNvnybQqWZ2ltWuCAkEO5y0SYLyh8hD3AP0CewQfAQiBuO4bgKNDhCdikAxbKu4jbcocsnDgqiBM8AEoDcCQgEiCRD3LIBKCkZQJMEn0MiQBSPb7RyicMCxCIkWSJgHsE2VqRAB8BOEhA4ApG4EhqQHuFuJHPAFJPqE/vDUgJI9u4exWtgCKY8F7bgUE2SEgIkpA3ACI4KTn5jhASZZeIHIXMAUjHeRIBSE9ykTkgcBvYQIj5gRJliAl6iOxQbgTvA4KBJ9STJkSQC3KY8lj7wHDJJexPwAsEXJRO24BCORG44YApOwhwA3JwyzsJUhBscwF95N0wqvgNwHyUgxXIcdivn3EQ5KCC5YnYIgpNxAkoQUk7BcAI2EbhORyAjcpOETkIyIvvI2IcBWRGpIlPyK5Apj3HAgCpyFuSGV7gUnHAXoSAixuJ3ImX5BVJyg5IvUC8cDnZjuAhyUxfcq4IpJJLwhvyUFuI3CUCZICYI/0l/ABO8FJGwSgqHcNSSe5kFTlbFJEMMgTt7jlERdpApHwJJPcqC4KO4jcKpEJ5JIF52ZTHdmRBI3DcDuGBSRvJJgLfcovLCchuBxJBxH4nuguVeInpPm2lswtW3iaqHfwV6qleajEUJu39blJ1eWTQtqbS2a6B1Lmumc7sPDZtld+rD3qeVV5anSq0+6cOGfSI15tzWv8VHwtrG4G11d01l/9H4NU4fOLdif121Kpt1KhctOqptx8zus4Z2jLWkt/mRmNm5Tdoproc0VKaW/Qy5ZowAXliNvcCT2Ma6FXQ00mmoc+hkRqU4A2M/Cg8SNWGxeYdIs8xFuiihflWT3Ll11XLrqf1rST4VNNM7eps+pcqT5vdH6vzLp5q7JdUZPfqw2Y5XiKbyroW9VErz0/2sn0CdDeruVdbumGQ6xyqu2rGZ4ai/XYorVVVipqfJV6NejM7RiW9ZzD397biJDc8BKDl2JyUjQ4QUBFJkAAJ3CHAmdiTHBZCkCd4DW4h+oByE5EjlAID2CUBgF6hOQyTIFewKTbkA1I4RJngrCKCJyICjcIm/JW4REwK1IQSgQBHtuXuUkAUkyPYLYITuOdxvI5Co/cKRwxD4AyI3CDMa5S7Aca+IjrFl/QvpJqLV+Pqt11YDC1V2MNXdVuq/XwqKZ5e8wk+DQBnmfY7VuoMzz/ADW9cxGZ5lfqxF+5eqdVTbeyl+0HdT4qXX+31D6jYLptlmIpu5Xpy67+YU+Vz+UpOnyT3XlqTOj6+s55O6x6sbz6Ht2KnvAiSbHbJaiF7eoiAIlychdAOi2P8QXVzI9FYNOnC4i7TXmOIoU/k+HmHU184OOrt1WbdVdW9NKlpcvsjbx8MLwyrpf0z/k8zi3bq1HqehX6G7TouYWx+b9E596fN9pzM+HdYzOXcXRWkcv0NpfLMiyzD2sJgsBh6LFFuxQqKNlu/Ktt3L+0/cXI8uwShmbdkR7jhiPUA0OEGpHYBIkIoE5W4YUNDlegUe4nsFtsCBxwJ2EbyUqI+Ag+AuAqLdmRO/yEgHwRblnkJyAiQmJ3Hb1ARuUkzsN0gEQw+UOYKBi95KpDERuEG4CcjkJIKoJA9ACUD5DuOAC3W5SN+wnbgA/0lMYlhUgWJCclJGwAjkpQJAjYJBuH7AONhIkLfcB7oNSOUHyA+RSeYEFJ5UUk7FDsRTJZ2HbYA90EI+4kS5ArKRiJgIMTuJEywqkYX6SVAWEI3HYICkey2C5KER7oNT8hwhOwVN5ZYnkL1G+4BKCS5LOxIn2Au3BEoYnbiSxuA44JLK1IATLKTjsIcyBGhG0orHYIIpEoKBGu5PcrI/UKSxwX5hgT5F3EQSAK+CekmRNwHcJQO5QibyJ5DfYpFTlBSOB2Kg3BSSkI2IpAj0EbBuCieUscDkn7ICtwT5FmQAe+w4JwixIFAI3AFI1IYiUBTH5FW3cTvwEIkTuGF+IUQEByAiBO4alBL7wDUhsJjlgI3kncsbyR8gWERFSgPdAUEfG+4b4YFI1IkAGtiNMqkPYIdyRuXvIjlhUcFUkUF4IKCTsE5KDco/K1Lp7BaryDH5RmNmnEYHG2K7F23Uk5pqpacej35P1YI6ZA0B+KnoJe8N/WnN9LUWb1GRX63ispu3G607FTflodfepJfP2OJl+g3W/ED8MVnr90iv4vLcNOqsjVWLwFdupUuvaKqan3XlT2NJ1i7Vctvz23auUvy3Ldah0VejRpWcsL1xOXkjfcQOScHTMHA7l49wI4aafDO+nwpvEHb0drLMulmc4pWcvzer8pyel0Op1YhwqqPN2Soobg6GJSf3ac1DjtFanynUeVX7ljNMrxFOIw9y1V5aqXxUk/3ra+0kxl1WcS+kakyZxx4fOrWA63dJNN6vwH63TmGFpruWKrirrtVJulqqO/1Z+05GfG5k9DIGMSjIKm4ngchKAKYtblbEPuBILygh24AIpFwUCAQHwBSNwTy7FgBI4QRSDFzA9CgobIAJQBFuWdymMSBkQNhAOOxSdtwkAbG8jZbhAJCciA/YAG4CKBE5Hf2EQIAScXeJbq/guh3RrUmrMW3VXhMLUrNqitU1111NUryz3TqT+w5Pq2NSvxWuvNOuOoGVdNsqxNq9luRTi8dds1OXeq81FVqtcfV8qZY8y5mcQ6P5vn+Y6tzvMc+zjE3cZm2aX6sTib16qa3U9t38kj+TgyfryzFmrz8qlCHl9yAIvYR7kZhcqqt25ppddbapppXNVTcJL7WBzb4N+gGJ8RXXTK8nrt13NPZVXTjs3qoX+0z5VTL2nzOk3y4LCUYLC2MPbXlt2aFRSvZKEdS/hseHv+U70Pwed5nh/JqPUtFONxLuqLtilx+tP2Tpk7eQZTOXprGIG4Eh8+xOWR0PksjYbICeb2LyH8ikEiBD9QgigwxG8jj3AISG4HMeoE7+hUICCEeo4QfoOHyFUncdgtwhwygBUXzEQFyJkBEDkpIh+wBbMjZXsIATI/APZbESQFe/cLgQHEAB22AfsAh+pOfYr+cBAJgJiCkET3G8iBO5QbC4I5Kt+wBJCQI3CA7xA2Q9wpwgg2EwCDUidwnL9gHyJyw2/kXZsBAKAI+Akw/cdwEBfMpFyAfATYakJQAa3C+YYe3ADlyJKQA/UiLA47BE83sZE2EgIC+8TuFzAB8oMR3C3chRj3/QJD9gElJ3HbcB3DC4EgOwEACfYEiqZKBGGGx+kAmUnIb9iIMJ+ofHBIllVWIYQAn2mRPmJQBcegkciACcjnuOEEiByw2UkFBKBO3BJZd1yAnYcoCPQA9hIgBEU7lnYPnYkBVn2C5CDAJyF3KAJElBHPYIRvwJHvICjcFI37BbyQAgEoKJD9ShlAiElIpSANjtuOVJP0gVBES5LwiBO5JkcvgclFW4CQjkAnI49wh3kIoInPYBQLgpJ9iIbyEHICqRT3EjcqML9mi/aqt3KVVRUnTVS+GnyjSr8Rnw5VdEetN7UOWYS5RpfVVyq/TXRCs4fEtubSXKimlP7eTdZucKeLroDl/iH6M51p7EWbDzS3ZqvZbir0/wBDXlH1lHeE19pYnCWjMNC0Q+SHlxmAxWUZljcsx9qqzj8Beqw9+ipbqpPb9EM8Rq8+MH2ggCKuHuSfre4+0j5A76fCc65W9I63zrprmeJs4bAZy1jMuquT5q7/ANWhWqfmpZtjW65Pm50xq3Munmp8o1Xkt54fNslxNOLsXE43Xb9J9BfRHqbl/V/pdp7VmWXXewuY4amvzt/sltV+lMztGJeis5h757SUiQ7nLokdxEFCoxEdxIXLAJyUncjQRkCPdEXYKs+wb+wpO/qAnb1EgAPfsUACDkbIIBBQT3YFBFvuF7gAigIgmQhG4VGjIj9Q1uBScyUkyAjcNwwyPfgBuysLgjcAegddOqOXdHelmoNVZnf/ACazgsNV9Hc/+rUmra/toPn2z7VWZa71JmuqM6ufS5tnOIqxmJrmfrVbtfebDvi4ddFiMRkXSjLcVctX5/Ls1t+X6tdqqlO0p/fU1GuJQ90onsd1j1Y3n0ZdtiSAdshF+ZiUCtpI508EvQ6vr/4gMoy27hfynT2SV04/NKqZfkpfm+jT/s6UcD3bn0Vt1Ptwl3q7L7zc18NPoHT0l6E4TPcfYo/V/UyWPuX1+erFapqotv0hzt7nNpw7rGZy7dYexRhrNFq1SqLdCimmlQkjzdglsODN6AeYpOPkESVJeUIKFRcspG4EgG4KRBbBBPYLcpj5gL+cTuVoKZCjHBSLlkADgN9igGhwUCIpjs2XjgCNlSgi59i9/YAnIbgjRW4RAneBEbjsKeChyiLbcLgdgK9yeg3ZXwAkk8lQkIcjgJyUKjcMSJgNSEH8yexZX2hIKpEI3C22ATvwUEbgAxz3KRoAUkcBgO4+ROxU0kAjYJCNwlAE5bKpAZBSMjLBQ5CE9guABSblAj5gj5KygSQpJwytSEUnI4HAUXciUliUOADcCNyk7gUgjdhNARscIrUjuETuN2jIkRwFEoKRv0ENgG4CUCIKBI3EwikmQEQFuNkEBQR7DuEJgSyP5lQUW5IgrUjuA7ESkvAlAEE9xx8gluETuEy8LciXYKq3KTsSfQgqUCNwmHwUJQJSiuQKSJE7biQiLkqcyEGpCqTlEfJZ79gikfAjcoVFwJgpHvsAXoR8hoq4AJtiPsDJDIK/QNwTYvJRScr0ERwRPuEVuCkZQqLuOEBy9gI2ZEbCchFMUWYD32CkyUi9A+wQbgQBJFIKSdwyikA4QQbgRtuTngqCqRuAx7hDePcxqUymZSSJchWoX4pfh6t9N+puC6kZVYptZPqSv6LMrkeWmjFPamEtvzKDpH5k3zs+H6n0CeJPohgev/SPP9IYtUU3sbYrpwmIqSbw95qFWp7qWaBc3yTG6azrMcmzGzcsY7Lb9eHu03aPLVs2qXHulJ3WWF49X8qH4iAdsxF7kDAOPK01Pqn3Ni/wkOuleEx2e9K8zxF29U3+XZY7n5lu1TTFVC+dVRro7M9m6V9SMT0e6m6a1vhPpKqsmxdF69Zt1OlXrKc1UuOUzmYzDus4fRfTUo2Mz8DQ2rMJrfSOT57grlu7YzDC28RNqrzKl1UpumfZuD95epm9CkKR9gInuWNwmpKABjwo7l4CCUDhlJHqFRvcq7CBwBSc7h/oG64AOQgHwAe247EW+5kEYt+pRDgoESgIpE5ANwEGpKRU9g+yHcQUJnsUnAUyAb3A9wgG8+xScBuAHyPx9Xajw+kdMZvneMaWFy3CXcZc3iabdDraX3H7DZ0c+Kp1xr6f9GcPo/LcTcw2ealvU00XLNcOmxRXT9KnHZ01NBJauer/AFHv9YuquqNZ371y/bzPGXFhVenzW8Oq27dO+6STPUnsjG3aWHt0WqfzaKVQvsK3tBrEYeaZzIkGi7EZUIHzCJXXTRTVXV+bTS6n8kBy14Uujd3rx1805plK5bwOHu04/GXladdFNNtqummrslV5WtzfvgsFYwGGtYfDWbeHw9qlUW7VqlU000rhJLZI6GfCf6FfyI9M8w6hZhYrtZvqG47Nui9u6cPbqbt1U+kqs78qkymcy9FYxDInCHAfBHaTuVkXoWNwHYktFb7El8AXlE7lGwDgnv3MidyAGhEfITBRHuXlBwxwgG4nYfMRvADkbkWzMgIHJQBIJxsireRwgCclMe5U9wJ8i7wIAAdxKQmQAgPn3JywLvI3DcBgUj59xO4/ECTBkYy0WO4Qe4ZEWZQUSQXLEB7AG4ESQsQwCCUDuUDGPQs7wOA3ARSMSEwpwhEoc8hcEFJvHuSWUoBPdk7jdAVoie5VsT3YGRNwnITAcOBEE7le0AUjU/IpE5CCQncSTZhVI3uWCP3CKHuFBOXuFXjkJyOwUBDl/IfgGHxAUTkR6hOBLYB+gQ3HcCkclI+AJyhuixwOWAa79xwg99iT6AWJEMTuGBIclEh/oAm/ojIkwhIRHyZEnYJyFN/Ucch+oT2APgRHzEjuAC5HJI3gCvgnYvOw9gHoOfkEoExwASKCTsAX6BG/sEOGEN59iPcu7YhIKTAQ2kjcMCsISO8AUjcMRyHCANSiP1MiRLAjkssPbcTz6gCQyzwPmAQgdw0BEi7wI4KBNwtgUCQkIhbFInIQiVuA3A5Cg7e47DsBSNSEJAkQysRuO4FBO4mABSR6BKAC33KRSO4ROXsXljuJ3Cpyah/in9Armg+qWC6jZVh3+pGfL6LMa19Wi1iJVNtJcbpNm3j1OJPFH0Vw3XvovqLSd2zRdxl+xVdwDriLeJVLVurf0bEJMZaBNw0eXHZdicjzLH5TjtsbluJu4O8oje3W6J+3ynh+w2eXhQlyEAD9DGq1Rdpror3orXlqXsZQ4JP3gbWvhL9bK9S9Ms06fZlfoWN07enCq7eVV2/buOuttJ7tU7L2O/s+h8//AIUusWL6E+IHS+pLFVFGExV1Zbj6rimlWrtdNNVTXqknub98vx9jM8DhsXha1dw+It03rVa4qoqSaf3MymMS9NZzD+reCkSlBSyOiYAiZCUBBbjuEICgEepQiMJQOdhG0BR8BOQicICuAyOJMgJwFI5E7+wQHKIzICbhDlBcBVBGJTIKACiDdhbPkoE3Qe6DC2CD4JvsUSFYXX5KW20ly2+yNFXjs612ut3iSzzH4C/eeTZLSstw+HuVeamm7RNu9VT83SbafGT1hwvRPw/6nz+/ersYi9YqwGDuW2lVTiLtFSttfajQpRVevuvEYq7VexOJuVYm7cq5qrrfmqb+1s6r7s7z4wzmBy4BWaMED2HzI9gHKPYummhMX1R6i6b0lgrF3EV5njbVN/6H86iwq6Vdq+SpbZ69zC9djv58JDo7Rn2tc/6m4zDXbNGWU/kOXV1peS556aqbrXyaRJ8O6xmWzvQek8LoXRuS6dwbnC5XhLWEt1Pl00UqlP8AQewTBjSklwZcsybj2EgNwA7k5ZUICiDcDtyGpfsQRcsqQjcAUm8yJJM+xUVcyA90TcKeUvCDcET3Ad9yxIa3CCCUBzJQRUZSND17lDzDlkfA7AVhbuSk7+wFJtyGOwBOQB3APcpjx8it7AG4JSVvYkcAZEgSHsET5lncN7DvwFIJPBkTuAZIbKGwI19pUwuA1G4DhCPQchABBSd+SIRuSd5HfYsyuCqPcpOETnvAFjcRyHxyJCEbCJfsHIQDjngLf5EfHI5XoFWIBSJhCBAKBjBY22EFCsUjIEYQ5EbkXcu8BUall9ib/aXt7gI2IvYrcDj3AEdJkRBD8Bwg1I7BSRECY7CQE7cE4K9+4jb3AfYPXsJiCLkCtSgt2JACNxI47iOSCb9ihIcFCCLf5FfBP0AVsLgcBVSAT3AgTyQIj3E7D5AqHJFvyXjsSdwqyHvuikgBx7hRBSbPYA1JTGYKgglBGtyvjYkgZEYEQFOBE7j7QgHuFAbgchCI3G79hIkKTuR8l47htyAmfYifYqnuI9AgIkbDgKpIkOQ9mQG4KY8oTuUXuUneRIFBHwJ3ApE5KRr3CDKR7CdvcKPckfaVPYkgUpjL9An9oReSkXygoVHsxyg/lI9ewDhBqRwh25IHsI2AclCDCtfV9TJSmGoTA01fE86F2+lnW3D6ty/D2sPkWp7c1WbFt002r9CpTb7TVVU2dPoanc3neOrofb64+H3PstpijMcuo/VPC3KV9d1Waaq/Iv3zSRotw9Vyq26b9FVvEWqnau0V80107VJ/ad1lheHkI1uWAdsxAhYA8WLw6xeGuWXu6k/L++7G7T4dfXZ9avD3lSx961+reSN5bfw9uZotWot2qn81SaT2pU+h28+GB1jt9Mevt7TOMxFrBZJqiy/Pdut7XrdFXkS96qqoObNKS3N0oyMaX9WCz2M26k4ZN0yxLAMpGEgKCQGEEoEyChU5kpG4KBGUEX3gO4Y9REogQhPsGvsD3AoJ35DUlDkpF6AiEjuOEI9yqRuUxljgC8lIuBwgEoj423EJ7n42sNVZdojTOZ5/m178nyzLbFWJxF1L82ilS2Bq3+LZ1k/kk6gZD03y7HVLD5XQ8XmmGTUO59Su1P2Oo6FfnNuPsPZuqOvMb1U6mao1ZjsT+V3cwx1xWrrSX6zRU6bfH7lI9ZS8prHDz2nMkSPsMjGCuBjgvBi2kB479F69adnD2qr2IvtWbNuhTVVXVwkb7vB50ew/RPoBpfT1l1VV3LFOPvOulKpXL1KrqpcejbRqN8DXSevrB4nNN5fV5lgcnTzbEVOlOh1Wq6KqaX802b3LNFNu3TTRSqaaV5UlwkjO0t6R4ZJ7mSUCIYOWhzsF3IvvZefsApOQ+eShEiBMid4DiAolBJTPQutXWfIOhGh8Zq3UlvH15PhF5r9eX4f6aqhbKWpW26Os/wDPcugUJ/lGot9/9TF/lAmXdaUSZ7HSr+e49Atn+Uaj/uYv8oP57j0CiPyjUf8Actf5QYkzDusJ2OlK+Ll0DT/0xqOP61r/AChl/PcOgbpf9E6i/uYv8oMSmYd1GtycNHSv+e49A/8AfOo9v/ti/wAoX+e4dA/986if/wC7F/lBhcw7qfaE5Olf89x6BT/pnUX9zF/lDzYD4s3QXHYyxhqcVn9uu9cVtV3Mtppppb7t/SbIGYdzVsipyfx5PmmHzzK8FmOEqdeFxdijEWqmvzqK6VVS/uaP7I3Aj34KhzMBPYKNEhFfBFuBUJC53EQBGnJWwnIbgIgXcsyY1NJ+nYKy5DiDqd1I+Jr0U6Wa1zPS+c4vOruY5fWqL1eCwCu2pamFV51P3HrS+Ll0Cbj8o1H/AHMp/wAoMJmHdWU0WTpU/i4dAl/7TqL+5lP+UL/PcOgUbYnUX2ZYv8oMGYd1H2B0q/nuPQOJ/KdR/wBzKf8AKE/nuPQNzGJ1F/cyn/KDEmYd1XuVyzpSvi5dAn/7TqP+5dP+UK/i59AlziNR/wBzF/lBiTMO6qDR0q/nuHQNy1idR7f/AGxf5Q568Pvic0h4l8gxWdaNtZo8tw92qzVezHCfQqqtRKp+s5iUBy2g1uhDfcQFUncSAh3CJ7mQGLkQGg+AqocKCeaP/I486l9ftA9Jbd16p1PgMov27buU4a9epV24l+1pb3YHIjcIxlSa+eqfxetE5TgqqdAZDmGpMfRW6KlmVirD2XDiVXTU5X2HWDX/AMT/AK36zxFF3JLmX6MsfsrWEdOIf/SUFxLnuiG6WfN2iD8PUmuMi0fYd/Os1wuW2lzXiK/Kj5/td9duo/UrEvEah1tmWJuNy1Yf0Cf9pB6biMyxuMo8uJzHMcUvS9jrtX41F7Zcd8N9+ZeMHovk1VVOO6l6ewtVPKuYtKD8yrxz9AKYnq1pif6tRoTry3CXH5rlqut/u7tVX4stOX4SlbYemPcvad7fT/N0eH+f9dvTH/PUeax43Og2KqVNrqtpm5U+FTjUaEHl2Eb/ANL0mDyrCTP0EP1VTQ7Tvh9Eun+vXT7Vdy3byjV2VZjXd/MpsX1V5vke80XlVSqqPrp96T5qcMqsI6Xh8Ri8O1w7eKuUx9zP2Mr1fqXJcZRicBqnOMJdocp/ldy4vuqqgnbJ3w+kJV7cNfMU1qrdbo0S6V8evXfRlGFw+A1m8wwFiP6GxmGtLzL0dXlbOy3Tj4wOaW80wmE15onD4bLKUlex+UXbmIuv1fkapX6SYmHXdDaLIR1+6Q+Obo91lw9FWT6otZfirlat0YHN/Lh79VT2hUeZzuc+WrquUU10tOmpJqpcNMjp5W4KY+ZfMu69wpwgQqAEW3yKyR7hF5D7EaLDYUDCKBOORErknLOOevfXrS3hx0BXrHV9WMoyajE2sI3gbH01zz3J8v1ZW2z7gcjzuGp3OlS+Lj0D2f5RqP8AuWv8oH8XHoEn/pnUX9zKf8oMJmHdTb1L6HSl/Fz6BT/T9R/3LX+UC+Ll0Dq2WI1J9uVr/KFxJmHdbkNHSr+e49A/98ajXyytf5QVfFy6Bwv6I1H/AHLX+UJhMw7qzLgcHSpfFw6Bv/2jUf8Actf5Qfz3LoGtvyjUf9y1/lBiTuh3VEnSlfFx6B/751H/AHLp/wAoWn4uXQNz/RGo188rX+ULiTMO6xIk6VP4uXQN7/lGo/7lr/KE/nufQL/fGo/7lr/KEwZh3WRIOlX89z6CJf0/Un9y1/lCfz3LoH/vjUj/AP3Wv8oMSZh3X5EQdLbHxauguJr8ixmobXvXllKX8Ie4ae+I50O1DVQreqbmEnvjLVNv7/rBcu0Uv0Bw9l3i56O5q6FY6i5D9JU4VFeMoVTfyk5LyDU+V6pwVOKynMMPmGHfF3D1qun7wr9bgTsYef1n7TJVSBdwR7l4QFJ39hyhACdhyxMBKAJEliQ3AmF6gOBA9w3AQ7iOSVOIOo2tvig9FNAaozHIM1vZ/Tj8Dd+ivKzlyqo83s/PuB25XPBZ9jpT/Pc+gaf+mNRv/wDda/yg/nuXQP8A3xqP+5a/ygxJmHdb3Qg6VL4ufQLj8o1H/ctf5QP4uXQKY/KNR/3LX+UGJMw7qrYkJnSpfFy6BzviNR/3LX+UK/i49A1/7RqP+5i/yhcSZh3Valka29TpX/Pcegf++NR/3LX+UH89y6Bt/wCmNR/3LX+UGDMO6sStyR7nSz+e5dAl/wC0aj/uYv8AKE/nufQPtiNR/wBy1/lBiUzDuokWDpV/Pc+gf+76kf8A+61/lCfz3LoH/u+pP7lr/KExJmHdadttwzpT/Pcugfln8o1Gv/3XT/lD9HJ/irdB85vfR05nnGGnvicDTQvv84wuYdxJ2HHyOvenPHZ0U1HUvo9dYHCJ/wC/blFr/tHvOU+JXpdn9+mxlmvMhx9+pwrdnG01NgcmTuI3P58JjbWOsUX7Fym7arU010OU17HnVSXL+8KyBG4InuBY3KRFAEHeAAn0HPYJQxz3AnccPYqQIHBNyyOEUJgPf5DkNwAgRCDUiAKTcd4EbyECTPYyAV4r1FN23VRXSqqalDpfDRom8cXRSroh4js+wGGt368pzr/NPDYiuhKh3LjquXaKY/aykb3XD2OivxXejP8AJp0Ywes8Fbu3M001iE6bVmiXct3K6Ka2+8KlNlicS5tGYak6ZRDH6am9bou20/LcSrXyZkpNXnBAAQabTUHmy3Nb+nM8yjPMLLxWVYyzjaEnEq3XTW19vlPDO3uHSqpXapOlr2fIWJxL6GuhvUWz1V6UaY1Tbu27lWZYG1eu023KouOlOqn5qT3yIg12fCI6yVZzovUXTbEUP6XIbrx9q9cqc1W71bpppXslQbE0/N8jGXpicwvISgPeCcBWRNwFEgUkBKA3AAMDkBsUxXyKA7iI4I3uZASNww9hOwEf3ln0I/WSwoAJQUnK2EwBSS5C+ch7AFshO5SdyAO4W+5Sidwyk7e4RKkdMPik9X7mgfD7iNPZfibVGaaluLAVYeprzVYetOmupLnZxudzqnC3NKnxM+rNzqT4l7uSpUvA6Ss1YK3ct1J011Vum5O3MS0WPMpacQ6pWrdNq1RboSSppS+3ueSGzFb/ADZl+g1eYW2xPmH2LPcAkYt00Veat+Whb1N9kWXJ58v03mGtM2wGnsos/lGZ5tfpwWHtTHmqq4IsRltM+Ed0mu5D0vz3XOPsW672oMVQ8Fdheai1b89upTyk2kbA1twj0fonoLA9M+l2mtO4DD/klnB4K2q7UzFx0p1/3zZ70ZPTCRK3KSdyhU7iB3DAfISEoI9mBWSJQTkq2A9M6v6BwPU3prqHTOZWfp8Jj8JXbqoXdpTT+lI+d/PNLYvR2fZpp/NMFRhswyrE1YS9aroTqpa3329Gj6Ua5acGm74oXRi307682dV5fhbv6n6rtO7ir7b8ixTqahf2NKOoZ2jMOmv0NuP6Va/tEZK1a4+htf8AJoyhzvBVwdsHjdm3/uNv/k0FYt7/AK1a/wCTR5Sdyjxu1a4+htf2iCtW01+tWvl9GjykYGH0VtuPobX/ACaP5sXglfw963RaoVddLVPlpS37H9q5LRV9HVTWuaXIG8rwDdVsR1c8NGl80xtVtY3CU15fctUNN002X9FS381SdjHLNWnwgepNnK9R6z0Hi8XXVfxat43AWG20qaVXVdj7akbSqZaMZemJ8Lx8hyUnt2Co0V7dhEJkhwFWUE5ZEtyzAQiGF8woYhAOD1Lqt1BwfSvp3qDV+PpdeBybB14y9SufLTye2T27HSb4rPU3EaQ8PVzT+X36KcZqO+sBdstrzVWKk1U/vQwNRGc5qtSZ9nGc3F9NVmONv4jzXl5qlS7lTpW/s0fyfQ21/tFr+0RlbSptUUpQqaUoX6TI1eeeXj+htx/SrX/JofQ23v8AQ2v+TRnMFRXLx/Q23/tNr/k0PobSf9Jtf2iPKRLcK8f0FuV+s2/+TQdi1L/WbX9ojyojfP4BHhqwlWIqt2MPhrd3E4m5ThrNtUKaq635aV97Rvt8GvR+x0W8PmlchowzwuNu4ejG463WvrU4i5RT5196NRvgi6OUdbvEjp7K8Vau/qVlL/VHEXrcxTXRFdpOPV0m+BRHBnaW9IZT6F7EnYs+vc5aJMjgRuWEgHCE7D5niv3aMParuV1027dCdVVdbimlLlt9kEeT2OJuuPif6feHzKa8XqzO7VnEKlujAYZq7ia/lbT80T3g6n+Mb4l2E0LezLRvTGq1mmpKHVYu5rVSq8Ph3w2u1feGmavtQ57m+ss5uZvqHM8RnWaXOcRirjr8qmYpluFJ1FcuJth2/wCvfxQeoPU+nE5ZozCWtIZBdoqs14ir9cxF+lvapSlVbceh02zfMMbn+O/LM3zDHZxit/17H4iu9y5cKpuDGH3cg7iIZzaZRU/VimKKfSlQh5VBQVwjW5dgAo0RMoCHLJyUj3An2GS3IwgpO6RW3StuPmA0EeOq3Srtu9bdWHvW35qLuHf0ddL9VUtznzoR44erHQWq1hsFm9WpcjVf0l/AZpW67lST/Npu1+apbTwcDpEa32I6iZhu68Nfj86deIW3Rl9OMWn9T27dFV/Lcf8ArVPmq/Y2664+k3T4Xodntz5qLNdzC4ujFYe9dwuLtubeIw9bouUPs1Utzvx4PviYZjom7lWj+qt6vH5TVVThsPntNLquWu1P0vNVW8TU/WTia4a1tltefI4P5cszXB51gLGNwOKs4zCX6VXbv2K1XRWn3TWzP60ctDdoi32KybsCqQ3A4Qp4ANBFMfMBkdKPi7KPCFe7r9XsBs/nWd1zpT8XL/Yh3v6/YD8awno052bdH0dD+it/mr/a16HkdqjtZtf8mjKxTFuh/uV+B5DZ5niVq2v9ptP/APGgrVHazb/tEeQoHj+ht7P6G3/aIfRW0/6Ta/5NHkhgDxfR22/6Tb/5NF+httf0m3/aI8gCPHTZty/1m1/aIO1bn+lWv7RHkJAV4/oLaf8ASrUfvEPoba/2q1/yaPKAPD9DQk/1q3/aItNq2pi1bn94jykA8aoo/wBxtf2iPJFKUKzYj/iqSokAfz3sBh71XmqtKmpbp2/qNfaj9XA6n1JlNqm3luqs+y2inimxmd5Ur+xVSR/Ggk29iYWJmHYTp74/uuXTfC4TL8DqTD5vl9przWsww9NVytLt9JVLO2/Sf4vmQZjjvyTqLpjEabs0UJfl2XefGK5XHLVNKSU/iaxPL6ifqtNzS/2L4J2uovMPob6adcNE9W8uw+L0tqLAZp9NbV38mt36Hfopalea2nNP2nvfmk+bbTeos30RmtGZabzbF5FmFNVNX0uCu1W6aocpVKlqV7Gwnww/FQxGBvYHTnV6yqlXdVq1n2DtRRTS4VKroplzPNTff2OZrhpFoltAnYqcn5eQagy3U+V2MwyvG2Mfg71KqovYe4q6WvmmfpptHLpdmyS5KhHoFUn4CfvKBJHI4KEYXO3zPny8TFu3X1912/o7bjG0xNK25PoNqcx8z59PEsp6+a8/q6n+M6ry5vw4y+itune1a/tET6O35f6Ta/5NGZTR53j+gtf7la/tERWbaW9m1/aI8pGgPE7Fqr/abe37hD6C15f6Tbn94jyJcGQV41YtxH0Vv+0RHYtpx9Da/tEeUQEeL6G1x9Fa/tEPobf+42v7RHkgsAeN2LbX9Jtf2iFNi2v9qtf2iPIAPDXao/3K1/yaLTaoVLmzZf8A+NHkKFeOqzaroj6Cz/yaR48Pg7eDvK9Yqv4e5z5sPeqttfaj+giIZew5D1N1tpvMLGLyzW2fYWqw06Ld3H3rtte3ldcHZfpr8ULrNo3GW1ntOX6uyq0lSsPVRRhq2vepJs6jsU8+nuMOu6W2Xo98Wnp3q61bw+tsvxmj82vXabVu3bs14ixu4l3ISS4O6Wj9fad17l9ON07neAzrDulN14LEUXfLKlKrytw/Y+ce4qbqSuUq5T6VqUfv6J6haq6ZY2zjNJahx2S3bV6m99Bav1KxcqpcpVW00mvmczX2dxf3fRynJVJrF8O/xY7tq7gsl6vYD6Oqup0vPcutfraX7BO1Qm/tk2M6K15kPUHI8Nm+n80w2aYLEW1cprsXKanSn2qSc0v2ZxhpnL2GdymEzyZdtgonI4CEbgGx2HcTv7BDjkncOHIW8BWRIG4AoAIMfkZE7hlFI5E7SUgjPw9b6asax0nnOR4mmiqzmGDvYV+elVKnz0Omd+6mT90wrplSVHzm9StCXelfUjU+jLquv9R8ddw9qu7S6XXapqimpT2cHrr5fZHer4tXR+rS3U3T/UXD0028FnlH6nXrduniu1S6vNVHq6uTomk6dm9zWJywtGJUhVuw9yuFQ2ggA5s8FXVano34j9NZzisVXayzMbn5Di7VLcVyvLblL91Ub6bblNfcfNSr93CXbOJw7SxGGu0Yi1VHFVFSq/iN/HhQ6nrq50E0dqO7iqcVmGIwFr8tqp/Y3vKnUn95naPLekuYQTtsG4g5aE7hyUxcgZEewSHBBSORG7CKghED5idwpyhwUjYCJYaHOw3AjMiRIS3CHDKT3HIVSMNSI2ANSUgTCCW4ncMJgUmyEkcbhXqnVTXuA6YdPdQarzSVl+U4SvE3mnD8q/8A7nzvZznOI1Pn2b55ir1eIvZli7mIdy45qjzPy/og23/Fb6qYnRnQCjTmX3qXidT4l5ffszv9BVRU2/lNKNQ1NKVNKp2pSSj0O6wyvPohlA4fIa9ztij33Ebl7E4AveDs/wDDb6Y0dR/FHlePxFFyjDaXo/VGm5Svqu9RUnTS/sZ1gTVLmpxSt2zbL8JjpRi9KdGM21bmNqh3dT4unF4S6l9ZWVR5GvvpObS0pHl3voW3aCt7CnZFkzbj+QiA+QwH7JhsKQ+QC5YS7iRG4CdwnIiSgTiTqp8SDoz/AC2vDfnN/D0XbuaaepqzPBWbP51y4l5fL9zZ2rk/lx+Epx2FvWLimi7Q6Gn6NCEfNfaqdVqiuql0VNNVUvlNOH+lGcbbnI/iU6V3OivXrWOlX9JXhbWLd/CXq+LlupKqpr5VVNHHEzwavPMYkA78iJK5AEpEgA4eyCL7oDlPwqdTMV0g8RejNQYS3TV+U4mnKr9VWypov10UN/Yjf9Yu0XbVNVutV0VLzU1JymnwfNTiHdpsu5YuO1esVLEW66eVVTun95v38JPUrBdVegWj85wV2q+7eBtYLEXKnLd61bppr/TJnZtSfRzGmVmK43MzloibchuBwJCkyxO44ZQIxG0BgDCt+XhS/Q02fFP6pYbXviJy7T2DrroWlsHXhsTRP1arzr86cfKo3DZ9mWHyfKcZjsTepsWsPaquVV1cUwj52eputsb1M6maq1VmP1sXmmPrued91T9RfopOq8uLTiHrtOy3XI+ZUgaMGMFHI4CKAOWAJXcVuiu5VxQnU17IvCb5g/U0fpS71A1rp7SuHqqt385x1nCfSUL8yiqtU1VfZI4WPMtpHwkujtOmekuZ68xNF23mWocTXZ+jvKPLatV1eRqezVR374UHrHTXR1np/oXIdOWfLVRleBs4Tz0/s3RQqXV9sHs73XoYvTBwHuwhxIAcbgjcBWF69RZoruXKqbdulOqqupwkly2zVn8QH4geI1Bjcf0x6X4+q1g7Tqs5xn1iprzuYqs2moahqpVPdNVbHLPxLfGFV0yyH+VvpHHebVWbW3Tj6rL3wmGqpUqr9/RU4ieNzU3h8OsPa8lL7y3+2fdnURlna2GOFw1GEsq3bUJcvu36s80idoBoxVuSdgAgAABOSgKhSQUCTuJKQAAx3AFIFIFEiSSEX1PHds03aKqKkqqKlDTUpnkgR7hXbnwLeOfMegGeYDRusMVdx+gsVXTYw2IuVOp5Y5+36kKIS5ZuTyvNcLnGX4fG4K/bxWEv0K5avWqlVTXS+6aPmwvU03LdVFSVVFWzT7mxb4Xvi2eXY2z0f1ZmNSsQqdP3b7mmP9wp9G6nU/Q4mGtbZbQ04LJjKfujJI4aHJSIdwC2EQEUio+DpV8XPfwh3e3+b+AX6azuo5R0s+LlL8Id3f8A9/4D8ayp6NPFn+l0fvV+B5OWeOyv1uj96vwPIbPKgKRgUhftIFCkHYAmCh+zAAAATkFCJJSOZAFTHBCkUiSPdFBRi+f4w6FXRVRWlXRVzTVumZCPcDsh4PvGfqHw06jw2Ax129muhsRVTav4Gutv8lpn863Oy7Lg3U6J1plPUDTeAz3JMZbx2WY20rtq7bcyn6/pPnGff3UQd2PhqeK7GdMtd4bplqDE/T6azy/TRlty44eEvNJKiXsqNm/mziY9Ya1t6S2/r0CMLdym5TTVS1VS1Ka7ozXqcNVBGpKBi3LL2KAMKt47bnz6eJVz1814/wDh1P8AGfQXX2Pnz8Sijr3rz+rl/GdV5cW4cbJgBL3NHnJAG4E4KGApEAAIk7AofzAAEYVQwOwQ7IAJSADSHDJG4UfAiVuUSBi15qXS1NL2a7M5A6Kde9c+HrUGGzPRub3MPhKLv0l/KLtVTwt+eU6E0pj19EegFiSLEzHDeJ4S/GtpPxL5OsKrtvJ9W4a2qsTlV+4lU90poeye74TbOyXmg+bPIs4zPSmpMu1FkWOuZXn+W3VfwmOsuK7dS25+Ta+03MeBvxvZX4lNP1ZHnit5Vr/LaFTi8HU4pxahTetbv6u6UNzKexxMYbVtl20n2KiUmRy7QjUIsCJ+QDsRFa9AtgDUhhlAm/ruR7lewfPJAjj2I99zIjKIuTIACNzsGpUBpD7QOu/ju6PV9ZPDrqPLMJh7d3NsLb/KsJcuUy7bpaqrj500mivCYn8swli+489ylVVJLh+h9KOZ4C3meX4nB3t7OItV2bi9aak0/wAT5+/Ef0x/lQ9etc6Vw+DrweWYXH3LuX+ePr4fzeWlr7md19mV49XHDROCuUQ6YjZUSPcFGLXncR7fYbM/g/8AVOm9ker+nFz6tWX3nmlmuureqi46aFSvl5TWbGzObPBh1OfSjxL6MzXEY2rCZRjcR+RY9J7V0eSryJ/2TRJjLus4lvrVWwW7PHYrV23TXT+bUlVS/aDypGTdI2Ktg9+49gpMITtwEoKBJHrAEgN433CY3kcICkShDcSAgRwHBQBJ3D+cCAKR7lI4n3AfaUkSO/sAHLkpG4AIRvJSN7wA2Ma6ope3PoVdz83UWZLKMjzDHOpUrDWLl2X7UtoDT18UfqfhteeI3C5Fg7tX0elsJVhsRan6v0/n8yfz8tR1AW/oexdTtbYnqZ1S1dq/HUxis4zCu9Pskqf+yeumscPNacyu5J9gWPUrlC1OF6BmLh8gFgsRml7DZfhbNeJxWPvU4a3atqam252+xM+iDopoTBdNOlmmdN5fS6cJgcFRTTTUoabXmf6WzTH4A+mOJ6m+KXS9Vumm9gtO105ri7bUp0Jujf7akb0baVFNKpUUpQkZ25b0jwyUF5CgfI5aKTYktBLYDIjhgbAIEe4ncMAxx3DcDnYByGttxKkPcI1r/F76P1YjKtK9TcK2v1Nr/U3FWLdK+tRW3W66nHbypGs6pptRsnvJ9CniC6XW+snSDVGj2qFezTA3LFi7cW1u5UoVX2Hz35hgL2V5jj8svzViMvxNzCXX6uip0r74O6srx6sV947Ep2hP0KdsgEKAAAEbh8Sns/kbNvg99UL+N0rqzp/iXTbtZTiPy7DJvev6aqp1R8lSjWS1t6nPXgW6n4fpN4otLZnmGLrsZZmSrwF61TxVXVT5LU/2VSOZjw7pOJb3ad1wX1MaX2ncykzeg7CUOxHAFiR7od/YJ7hBEbMjGpqlSRXVn4kHVjD9MvDFqTD13qsPj8+tVZbgrlDhq615tvspZpOtUK1bt0J+fyrn57v8Tv58XbqdfzfqBo/Qdi5av5ZgKP1UxFNLl0XfrW4f2M6CwvQ1qwvPka3Y2SDfoQ6cCW47cCQggWNiTJY23Ai32Slndj4UXR6nXXWPNteYiqm9l2mrTwdGHrUqq5epbVS25pdB0hxt94TB3byflqopbpfq+xvH8APRV9GPDvkeExdi3Rm2ZL8vxN6jm5TX9e3PyVRzaWlI9XZSjZcGQQZm2I3HzE7hkU4OOuv3WHLOhXSrPdY5ldsUUYGzU8PbxFTVN+/5W6Le3epqDkSqqEaofiy9eL2odc5P0uyrGXKcvy6j8rzjDOlKmq+nTVZh8/mur0LHlzPh0i1vrjN+p2s831Zn2JrxOZZpfrvLzuforTqbt217U0tL7D8SCzvPHsR7GsPPMkk7lHJQkEgLcIoE7hL7QDH2kYrqVFt11NU0Lmp8IKogxy6v9WMdRhMBZvZjia9qbWEp89T+w5DwHh56o5vhlewHTnU2KtPiujAtp/pJlYrLj7kNbnI13w2dXMPRVVd6Y6mt0JS6ngXsvvPQdQ5djNKYpYXOsuxuUYh7KnG2vIMkxL+ci5Mbdyi9R57VdNyj9tS5RkVyFJ9hQAIAKiNlRGAPLgM0zDIcywea5NirmBzbAXVfw2ItfnUVrho8USVSnsF4b5/B/wBfcH4heiuSZ/RcsrNbNqnD5hhbdTdVm5TNK83vUqfN9pzfOxpq+GB10r6YdcMRozH4v8n0/qijzW7bhzi15aLaU+vmqNydDT+z1Mp8PRE5hnIgNBkdE7lJPqUgjOlXxdH/AKEO7H/z/AfjWd1fwOlXxc0l4RL39f8AAfjWWEaebO1u3+9X4HkMLLm3R+9X4GZs8wQBJcgO5ZkEgAykgSA7ANwtyKtPuBkODHzJdw60gMiBPaQqk+HIBgSuCrj2CIVv2JJQABJlgWRIAU5PFfs13aYtVO3fpfmtXE4dNXrJ5SVraJe/oBvC8A/iCt9e+hOW38Rfou5/k1NOCzK3RVP0dSlUT33opTOyq3p2Rpc+GR1kfTHxBLTuPxtVjJNT2aqKcPSk1Vi5potfodRuittwZTD0ROYZT67DeAUjpOWG4ZP2RWBhU+PmfPn4lNuveu/X8uX8Z9BlfbfufPp4k1/n9682/wDbqf4zqvLi/DjZICQaPOAB8AAuQAHJO5e4htgQpHUk4bI66V3QGRH8zH6Wj9sg7lK7oDJlInIlSAb9ik5L3CgRAEWA9wgAEkAVeT9PSurc30DqvKtT6exlzBZ3ll1X8PetOHK/Yv2PzFuY1KU9weY4b7PCV4jso8SfSjL8/wAFiLTzXD0U2MzwdNU3MPe3S867OpUur7TmyXBov8CHiExPQHrrltGIxKp0xqG5Tg8dauvy27Vyp0003W/3KT+83lYXE28ZhrV+zWrlm7QrlFdLlVUtSmvsMpjD0ROYeaSrgRBSOmPfkvIYUgBIkTvuEGOew4CkKpN2BxIQSgjbLPBQqdtyfIRHJZANTOxqu+MB0ueV6r0V1GpvNW8ZOUX7NK2SoprueZ7erSNqL7HX/wAc/Sn+Wz4bNY5bhcFTjc5sYX6fATzRcVdLqa/sVUIczw0TxFXcp47NdVVq27m13emtejTj+I8k7Gzzz4AICCD4gLF1YC7ZxdFPnuYa9bv0RynTWn/EIgOHTUn3UBYfQV4cOo1XVnohozVtdKt15pl9F6q2n+a5aj9ByZSa/PhF9Rv1V6Wag0fjsar2PyXGf0Ph296cP5Vv8vNUbA6eDJ6YWBG3IkJ/cRRP1EjknAFYTEjncBwE2GhKkA2UjXcSAcDeAOwQXuEJbDcEVSP1JL4LEooMLgbiXO4QYgbx7iWyKciZKSEUG9zrx49eoS6eeF3XOLsYunCZpiMH9BgnMOqt3KJS/sWzsNVKTZrL+MR1Aw+LwGgNEWrtdrF1YuvH4iimprzWnbqpSa/fUiEnhrYs267Vm1buublKfmfq25/jPKit+bflkNnmkL8yQPYIqI2v4ySYX6bjtVfRLzXW6aKKfV1NUr8QrZn8Hnpxhv1E1pr+u3ctY3F4j9TrLrTSqsxTXK+1Gyde5wL4IOnb6b+GbQuWYjCrCZn+QUXMZTG7uS939kHPceplL0R4Uj2Y+QZHSggAoBGtgHdCCUl7yAgEb3MgiJBtSOQ9wrC4tp+00ofEo6Q1dJ/EXVmVi1aw+S6psVYuxatJJU12/LTVMcN1VNm7Fo6f/Ez6J09TPD3j85wOFt3M707XTjqb9bU04ejzV3aVPrC+4sTiXNvMNM6n5GRjZrV+zbuJpqulVbPvG6M2oRq86LcnGxeAERPcqcAgFMsLmF7J8dgM0w9CqxOXYuzjLUuN7dar/wCyYphpVqql8Vp0v7QROH0J+H/qFV1S6N6Q1TdqoeJzPLrOIv00VSqblVKdS+yTkTlHQT4SPVLD550hzbRF3EXL+a5Hi7l+K5flw9TVNCXt9VnfpOV7GL1R5VOQ1JEvQrCgDHcAfy5njKMvwGIxV3+lWLdV2v5UqX+B/Vy2cJeMnqXd6TeHLWuoMNctrG2sH9HZora+u66qaGknztUwjS54leoVvqp4hte6ow2Irv5dicwrt4NVOVTainZfamcc8I8GDoqt4ejzpK5VNVfzbk87UmseHnnzIQArkBCgBMOJCCU1Jevd7QFcpeFrpViOtPiA0lpq3h6MVgbeIpzDMLdVUf0PbrpVa+6o39ZdgLOWZfhsHh6PJYw1qmzbp9KaUkl9yNcvwiujLw2T6j6l5ngXbxWPuU4bK7/m2eHhq5t++oRsk8sGU8t6xiCkqItjIjtGFwGp+QhAfj6t1Pl+jNO5hnmaXfoMuy+xViL939rRTyz53+oetMb1F6hal1NmOKeMvZhjrrt3Xz9HTXVTR/ewbjviU9TV058LGpbbpdVWe0vJ6IUtO5RV/imk3D2qbOHtU0qEqV+B1VleXlmQ3uVbohoxCBhMKTuUAIBOGDF03b1yzYw9H0uKxF2ixZtrmqupqmlfe0Ff35FkGbavz3B5HkOX3s2zfGXFbs4XD0Oqpt93CbS7z7Gyfw8/CYyzCYe1mvVzGvMswqppnJ8Bdas2mt/6ZS15vTdHMvgE8HeWdCNA4LUudYejGa6zezTexF+9RvhKXurVCf5rUtNrk7eJQmZzLetcPRtIdEdC6GyvC4HKNLZVh7eHpVNu5Vg7ddyPet0yz3TDYO1hLaos27dqhfsbdCpX6DzRsV7I5dPHVbVyl01JNPlNTJ65nPTbSuoLVyjMtOZTjvpKXQ672BtVVQ/RumUezxuYoDoh1/8AhWaH1rhr+Z6Av3dK5/57l+q26ncsYipramG0qFPou5q56hdOtTdJdYY3S2sMsqyzOsJW6Kmk3avpOPPbqaXmpcPdH0bR6nWzxw+FfJ/EZ0sx1dGEpt6tyq1ViMrx1t+StVJb01PmqnyqqKX3ZYnDm1Ylo8D9hXYxOEv38JjLNzD43DXHav2rtDoqorXZp8ETUcmrBQQfgEVMjcF5IAKQJhX9+n9U4zQepcl1RltNNeY5LjLeOtKpwvqOY+8+iLptqq1rXQmn86t3bd547A2b9yq3UmlXVbpdS+xtnzmXbav0VWv90pdD+03H/Cy15Rqjwy4DLK8RXiMwyjFXrV51ttqmquryL7kcWhrSXcuIRTF7svHBw1I3I32L3D2+0CTtB0r+Ln/sQ739f8B+NZ3VShHSv4un+xDvf1+wH41iElp4spu1R+9X4GZhY/pVH71fgZr9Bs8wmHsF7AAgA9gKWlfWS9djFGVK+vR8wOxHhV8HGbeKHLs6xeB1HbyejL7n0f0Ts01uqKoly9jnp/CI1TL/APTu0l/Utv8A8T2/4PsVZJrZNS/p3/CGyPyL0RnM+W8VjDVjb+EPqRr62vaE/wCpLb/7Qq+EPqVOFr22/wD9kt/4xtOVCmIRfJSuyJle2Gp3M/hI67sqp4HV+ExFSX1VdtUUJ/pOOs4+F118yp371nD5BmWGtptRmKorqX71Ucm6Z0KOEVUrgZO2Hzqa76Q686ZXr9GqdIZnldizV5asbThrlWH57XGkj1K3XRco89Farof7Klyj6Rc/01lWqMurwObZfhszwdc+axi7VNyl/Y00a5fGX8NLAUZfmut+l1urB46h1YrF5NVcm3d9fo1xR8kux1Fmc09mtTvsWTxzcoqrouWq7V6hum5buKKqKvRpmcnbNVwGBG4RQTsUAAGB/dprVWK0FqfI9UYFKrG5NjrWNtz+4cn0U6Bz1ao0VkOb/SU3KsdgLGIrdDleaq3TU197PnDvWfp7N2ytncodH3m7D4auuLus/C7kLxmKeIx+CvXsNcly6aVW1QvuRxZtSfR2sXuimPmfoWYOGqJ7sv4Bka9AMa+3zPn18Syjr5rz+rqf4z6Cqu3zPn18Sjb6+68f/Daf4zqvLi3DjWACGjBSdy9wECMoW4EmD+jK8DdzrPcmyqzcVm7mOOsYOi49/I7lymif748D2XB+nohv+WXob0/V7A/4RbE8LHmYd3L3wlOoNF6pW9W4Ku2ntVVbtptfIxXwleoTf1tWYH7Lds20KhS06Ux9HTvsjLMvR2w1MV/CU6gP/wCLMDP/ABds/ixnwmOp1rD1PC6jy69c7U1+SlfebdHbpj81T8h5PZDJ2w0s474WfiDwtyt2bOncbYply8yVFTXyVBw7rrwt9W+nWPqw+baEzHE0UJuu/lNm5iraS7yqYPoJ8v2GFzD0XLddFSVdFSaqpq3TXoWLSnbD5qa7itYm5h71NeGxNt+WqxiKfo7lL9PK9zOGm0+TfL1o8GvS3rhlLwud6cw+Dvp1V0YzK6Vhb3na5qroSdW/ZmsDxRfD51r4e7eJzzJKqtVaPpXndyypxGH34dCmqqNt/mdRLOaTHDqyVHhsXqcRaVyjel/evmeVOXB04SZYkSkJACPcAIJQIl+wHyCvFicP+U2a7dNTouNfUqTh01dnJvA+H314q649Acru46/buZ7lEYDF2rbT+jpo+rbb93TTJpDqcKUpaO73wmuqd3S/W3OdCOmi3gNRYarHfSVQorsUNJJ+7rObNKT6NvT3ZZSMaXsX3M2xvJew4DQEXOxUifIyAkiRARBSMCIKCEidxu5ARuHIclAh/JmuDWY5ficJV+ZftV2qn7VJr+M/riGSpKpNMI+eLxAdPKOkvXnXWkbSuPD5fmNX5PXWo89t001SvtqZ6Kd8vi4dNrmSdUdJ6wweEos4DMcO8FirySXnvup1Jv8AsaTodPKNInMML+JBwAdOFZHwxIa+q/UDtX8Mvqbh+nfifsZdeVVf8leEpy2jfZXHcVcx6xQbqqZdMPk+cTQOs8X031/pfVmX0J4zJsfRiaW/k6f4z6K9O45ZrkWXYzz01/lGHt3XVS5UulNmdo8t6TmH6SUMpOCnLQJ3E7lAjW4XcBKJANSTuZES2Ad/Yj34D5K9twhvAjYclCsUp+RUEoHBBQSdxvJRSMpGAmRwOAtwgokRAjeQ3AEre3uaPfiK9Q7fUbxW6hsxK01aeVUtKF56LlTf6KjdVrDNlkuls5x6qVNWFwd68m3G9NDa/A+dTVOssV1H1Zn+q8emsXnWOrxtx1cvzQdV5cX4flzt7FW5WkoJt6GjACUgm/2AOD2/o7oTE9T+sOidLYOry38wzGmflQvpP+yz1Fpcd2dvfhZ9NcLr3xJY3Pb1UV6UwVvGWttvPXVVbf6GSfEOq+ZbkMtw1OEwOHsU0qlWrdNEL2R/SpRKNlvuZIyekXyKRuPkEtwE7hS+Q13CAcCYKRqQhI5DcE49yKSirgbtlKJCE7jlFAnc/L1Lp7BasyLH5PmVv6fAY6xXh79vtVRUoa+4/UI0oCPnh65dLcd0X6w6r0fjrVNj8lxdeJwtFP8Ave7XVXbX2UOk9IfHZmw34uvR1ZZnenuqGXYOpu/GAzXE7QvzLdn+M13yqa3TMqdmaxOYYWjyyD9xAK4QBACvcNdxwEwrtL8NXqfe6deJzDZW/JbwGqcPTgr92upUqn6PzVr72zdhRwo7cnzb5JnV7Tmo8kzmxfrw1eXY21fddDh+Xz0+b9En0T9PtaYDqNovJtT5VV5suzXDU4qxU+9NXBnbltScw9jYiRGwak5dk7hkgrcAGjWb8YXqdZrwWi+n+ExVyzjbmIrxmOtU1OK7FVD8k/2VJsvvXFRQ6qn5UlLb7JGiLxz9SbvVLxR6vxd6lVWckuVZPhri3VVNuuppr+2LEZlzacQ4HVXmqdXqWYJG38Q78GrzqAiEFIUjKqlsZVjdQ43C5RltmvFY/ML1OGsWbf51VT9DHhbs7T/DT6Rrqb4lsFnOIpuU4LSlKx1N1fmVYilqKX9lRJ8OqxmW2rw99N8H0l6O6V0vgKaqMPgsHQ3TW5arr+vV/fVM5Hkxpo29zIyeg5HsFAXAFMXCTZZMa3FDYRrU+MNr+vDYHQmiXFVnG31mdajf9bqqo/7RrVahv0nY7r/Fo1Ha1F1/0vgbcOvKMpv26/m7lNS/E6TqpuZNKsb8q/YjEg6cHYe44D3QFBChEb29zs38O3onT1h8RuCxeYYOjG6d03b/ACvFJxteqpbsvf0roR1lVaph1cU7v5G1T4P/AE5sZV0fz/W1P+mc8zC7hK558tmt+X/rHMz4d0jM5bAYlSVdycGXczegW7kpHsAiLkrKSdyKc7GNyhVUQ1K4hmUSw1JRpJ+JJ0ls9KvExjswwtdVWG1ZbeZeRUtUWrrq8vlXbimTq8lKnsbRPjF6bsfytdE6itYZV43C5x9FdvJb02voq3HymDVyn2fz2NKz4YXjEryJ9B9g5Omake6BPKBkTd7Eb3KFE3RulutzY18HTUdnK8V1G07euN38Rew2JsUTsqVRW6oX2o1zTsztp8K/Nr9jxe04Cm4/oMXlOKuV0dm6Laj8Tm3Dus+W6KndTBVxuRbLYvGxm3OSkbgneQKzpV8XLbwh3Z/+f4D8azuo2/Q6V/FzU+EO9/X/AAH41hJ4aerX9Ktx+1X4GUbmFn+l0L9yvwPIbPMhFt2Kx2ApOSehZCEFtua6fmYpmduPPTPqgrZh8Ht/5j63X/13/CGyaTW18Hv/AFI1vHH07/hDZK/Uynl6I4SS89gJbI6UjcBuA+AHKPHct03aKqK6VVTUvLUmtmvQ8pGpZBpu+Jz4ccJ0g6pYTWuQ4WrC5Dqe66cVT5l9Hbxbl/UpSXlXlp4Om8Qzdj8STptgte+FjVeMxNp3sXkFirMcGkt1cUU/hUzSZau03rVFyn82pGtWF48s0HsJ+wHTg52BScfICiNiSUBRV5aqauI3Nlvwb8/royTqLkeJxHmWHxeGu4e03wqqblVUfoNaXB3D+FRqrEZf4pMVp+n/AEtmWW379Xzt21H4nNndOW5Jb7+plJjSoUF4M242UiRWgjGtzHzPn08Ss/y/NeL/AIdT/GfQXc/Y/M+fLxKN/wAvzXe//ty/jOq8uLcONih7A0YIJKAI19wKAqNn6miP9cvQ39fsD/hFs/MhVPc/V0Skupehmv8A59gf8Itk9COX0grlhdwn9ZlXcyepSSOEFuEJHJTHh7BVe69T+XMMBYzLCXcNibVN7D3qXRXbrU01J8po/piCtwBp0+Ip4PLPRDUz17pLBV2tKZref5bhLNE28HdhvzUpKKKIS+18nTFNVNRun3Pov6n6Cy3qdoLPNLZva+my3NcNVh71tfsk9/xSPnw6h6EzDpdrzUWkM2o+jx+TYuqw6V3pf1k/uaO6z6Mbx6vwIQY7FO2SAdxAUKRbFCI9j3joRqzFaG64aEzzD4p4OizmtjD3602v1m5dp86+5HpEwfzY6q6sLXXardF2y1eorXZ07okuonEvpWy3HWcywljF4erz2L9um7bqXDpalM/qnc4z8OGorWpuheg8bavfTt5PhaLlcz9dWaFV+k5MW2xk9BJIkcFhBRbBKB3KBJ9hv2HKDWxASgQOdgtiguYDcCQt2BI2MiMJyECOJZkTkDqP8TfpWuo3hhzvMFXVTf0z5s3s00KXXVTS6Y/vjS7ZuU37VFyl/VqS5/SfR/rTTWC1fpfM8lzC39NgsdYqs3bf7alrg+dDUeS4nTep88yjF2KsNdy/G3bP0dXKTqbp/RB3VneH8TgCGnvwT5HbFYI9vcokDw4imq9h71ujaqumE/RzJvV8BGvq9f8Ahd0RjMVi1i8ztYX6LFuZdNSrqST+xI0XpxVK5Xc2a/B31rat6V11pXEYl3MTYzCi/h7Tf5tpWlMfazm3DWk+WyKZ2KYpzEGS2M2ykkjexZS2ALkoBBE5KTiQnICNwnIncpRAAwKSAmUCEjsVhuADHL4BQJyghECJApGpD2I+GwOunj81tf0H4XNY5lgrys46q1RYtbw6vNWqXH2M0XYWw8JhbFh/nWqFQ/sNoHxjtW3rGg9B6ewWK8lWOzG9Vi7KfNCt01Uz9qNY1dXmuVVd25O6sbydpMe5eRB2yN0/YAAVNU/W5heZ/YbUPhBaEwuG6Ual1i7DtY/NMyuYZV1LeqzSqKqfsls1U4iuu3YrdFPmrqi3Sl3dWy/E30+CfRtrRXhj6fYJYf8AJsTcyuzexNEQ/pXSlU39xxZpSHOSTLw/YoM26ciSke25QmBA5RQBGHwOwDuUm69xG4DuJDUiIQBsL3IlJWghMBqEPmIIriXxS9I8B1r6H6o03jsO8S/yW5i8NbpUt4i3RVVaj+yg0A14HF5ZevYHHWXh8ZgrtWEv2quaa6HFU/afStcU0NNSaOPiB9GF0d8SWbV4PC3aMm1BQsfav1KKasRW6q7qXylHdZ8s7x4dcogjInKBowUg4KACAIJcoVy1VTVw0189jcV8LHqjf1z4b8LkuOuJYjTN79S7dud/oqKKYfympmnZuGo7bnc74VXVPCaI69ZtpnMcVWqNUYWi3grH7H8o8/nqf9rQS0eGlZbiZEkp4MjNsEEygwOOPEN1DwPS/o7qnUGYXvoLFjBXbdNxOGrldDpp/S0fPZhsZicyoqx+Mv14jF4yt4m9dr5qrq5k2u/F16oXdOdHMj0dhHTeuakxtVF+lP61FFryVp/bLNUnkVt+Wn82nZHdWV5ZPhMx5L2B2yAAgBGUxq2QGN2tWbVdypTTQpZuU+F/0Uq6X+HnDZ3iavNmGrLlOZ3aK6Yrs7fR+X+8T+01N9HOneI6v9XdH6Kwt52Ks3x1NFy5+0oSdUv7aYPoa0/lFjIsnwWX4e3Tas4WzTappoUJJI4s2pD9BbcmQJG5w1OOxQQBwY17pprYyglW8QBor+IRnFeP8Y+tsPVW6qcHFqlftZt23B17pOcPHc2/Gn1O9sVbX/QWzhE1jh57chGUhXBBSFCiAYCPHeUYbEOrZfQ17/Yb1vAhoOnp74Z9I4C3QqVi7KzB7Rvdopqk0RZzVUstrptuK666ba/stj6I+gdh4Xoj0/tNJOjIcEn8/oKDizbTh7847FkeUNHDQnYKAuCcqQpyyrb5hFAnD9g2kFuGgOrHxJdIWNSeFDWeMu0J15ThqsZbbXD2p/jNJlFxXVTXTsmlC+w3v+O/C1Yvwg9U7dP51WT1pf29JoZy3zPAYZ1cul/id1ZXf0zI4KgdsQj+RQBI9hBQBFS0dpvhfVKjxm5NVx5smx6/vKTq3PB2i+GS/wDRk5Dv/wC58f8A9Wk5nh3Tluyo/NfzMlz7kp3RVuZvQMQR8lAj9zpX8XT/AGId7+v+A/Gs7qvdHSn4ubnwh3v6/wCA/GsJLT3ba+it/vV+BmeOz/S7f71fgeSNzZ5UBSMKdwwAh2Mra+tT80YIyo/plPzQGzL4PajJ9bf8e/4Q2Ss1tfB8/wBR9br/AOu/4Q2SwZTy9McEjgQHv8jl0PdDsOAnJQ9xvI52KB6l1T0zb1j0+1Bkt1J28Zg67dSqUr1/iPnVvWqcPfv2aeLN+7R91bPpLzb/AFMxfvZr/wCqz5tcZQ7WfZ9bqn6mYXUk/wB+zuvLK7ECAlLO2KDnsGAoX8CFiQCOxnw8s7Wm/F5pbErZ4jA4rDN/vvKjrmzkfw059XkHiT6a3rbh3cwt4Z/Ku7QiTw6ry+gy226XPqzycmNNPl295MkZN1JIbgPeArG52+Z8+fiWX+f7rv8Aq6n+M+gyv9jPqfPp4lp/l/a7/q6n+M6ry4tw4157AcA0ecW4kE7hRbiSkCKvc/U0Vt1M0N/X7A/4RbPy+D9TRLjqZob+v2B/wi2SVjmH0g/svcySgxj67MzF6kn1HPAY2RQgL7g3PATlEAP7w3BQjx3E2tjUB8V/prhtI9ddP6hy/COmjUOBrrxl+Nnf+k8tP2+Wk3AveToT8XjTlN/oRkueWMP9Ni8uzW267iW9Nry1N/ZJ1EpMZhqee23oHwSmp1U01P8AZJVfeU1ec3HcdwgignBeQJyY36fPYvUJS67dVK+1Ga2Mre9ylerCtzPws85xGd+EbJLmKrdV2xmGMw68z3VNFzypfoO3nJ0J+Ebqf8u6GZpkif8ApDMr92P392r/AMDvrU4ZjL0xwrD9hOw7BRP1KYtFXAFI5kpPYIPlFJGxOHyFVNDgRIQCJHHYdw25AoACMa4jfg0Z/EL0Jj9FeLDU+Iu4b8my3PV+W4OFCrpoppobX2ybzXwaw/jC6CxV/NdB60opdOEwturLLtaW03LnmU/Yixy5tw1yTKCRF+dV6SU1eclQEAgHHyO1vwx9Z4XRniow2FxFxqnPcBVhKKJ2d2qulL9COqNW3yPeegmrML0+699PNVYuvyYfLM4s3LrbheRNtySY8O68voco2SnYzltH8OU4+jNsswmNoh2sTZovUR6VUpr8T+2GZPQr+QgcIoQI5KSdwop7h7FIyCke4THKKCD5HCKETv7FMe8epUoCjfoIQgTGwCZHeIEfYJ7APdEan5l4gTPyASR8SzI8WIuU2rVVdb8tFCdVTfZIDTJ8U/U93PPFTRl9nFO9l+WZXh61amVRdfnpq+3ZHUdP7DkvxQagv6o8SnUnMLt76e0s2v4WxXP+10XHH4nGfc1jh57cq3IG+w7lcIWJHcTCbCv2tD5JitR690rlODw7xNzF5nYVVtKfq03KXV+iT6McryzD5Rg7GEwltWsNYoVu3bpW1KRpA+HppuvVPi30vbuYf6fA5bauYm84/NdVDVP6Ubybfd+pnblvThmCPgJbHLsmREcDgdgEyJ3gcIRHAQKSdyhU7lBG4Ig32C2Q3kFU3C+Yb2HYBMhkUFe4EiOTpN8VLosuoPQu1qjCWrt7N9MX/p7Nuxb81VdFyqimuY3hUps7tcH4+rsgsaq0xm2TYimmqzj8Jdw1XmUx56HTP2SEfN9bvU4izRdoX1LlKqpXsX1n7D2nqv09q6SdUdV6Jqpu+TJcfcsWLl2lr6SynFNSnlM9Xjc2eaYxKLkr9hsmicAUBF2gIjex7P0q1vjOmPVbR2r8BSqsTlGYU3PrOF5ak6P+2z1juYX6XdsXLabTqWzXZrdfgJWPD6SdP5pbzjJcDjrVym7RibNF1V0OU5XY/RiTq58Ofqvhupnhj0xZ+nqxOZZLZWAx1dcz9JNVS/vWjtHskYvSR7mNcpbKSzDPWupOqKdF6C1HnzuUW6sty7EYqj6RpJ1UWqqqVv6tAaZviOdUaeo/inzaxgsZVeyvIsNawlNlv6tGIXmpux77I6zH9+p9UX9dapzvUuLtq3i85x97HVpLtXV5l+J/A5NY4ee05lScE+ZUVDZFgE5CL3Ma529O5k3Ji7VeIuWcPZj8pxF2ixapfequpUr8QrYT8Iro9TnOptVdR8bbtYrB4alZbgfMl5rV2mqmvzr+xbRtPpUI4S8HXR2jol0A0np69haMNm1OEouZi6HKuX+9U/KDm58GU8vREYgb2C4Eeg4ZFUncTITkKd/Yxq2aj1MiPkI0LeOuavGd1SqjjG2l/wBBbOEf0nN3jpn+bL6qen5da/we2cJM1jhhbkAQK4SZKOAAEwCqOQM8JhljcxyrDtSruY4ahr51pH0UdMMMsF090zh1srWV4ahL0i3Sj56NH0K9rTS9upTTVnWCTXr+u0n0VaUt02dP5ZbSimnCWkl/Yozs3pw/X557FmQ9+BwctBdxEcCUGpAkS9yxAnccoAlAU9yc7lXARwt4zbSv+F3qTQ3tVlNa/vqTQRlq/wAzsP7Kpf3zN/PjHuUWPDF1HuV1U0UrKq5qqey+tSaBMBdtU4DDp37ScVNp1r9szurO/D+tLbkjMfprK/2+z/yiL9NZX+32f+UR2yZx9xCfTWv93s/8oifS2v8AfFn/AJRAZRuIZh9PZj+n2f8AlEPprMf6Ys/8ogM0do/hkL/Rk5A+36j4/wD6tJ1Zd+zysRZ/5RHab4Yl2ivxk5D5blFcZPj58tSf7Gk5tw6ry3ZUvbb1MzGhbfaWdzN6BhdxvJQI0jpV8XJT4Q739f8AAfjWd1eX7HSr4ubjwhXv6/4D8axCS082HNq36+VfgZyeOx/S6P3q/Az7+xs8ylJyNwE+o+0egnfcAjKhfWp+ZBR+fT6SEbMfg9/6j639fp3/AAhsmnc1s/B7f+Y+t/8Aj3/CGyYynl6o4UjXcbyJ3IHzEQhIUkUXBSSPmUfyZrtl+J97Vf8A1WfN9n1Hk1fqeifzcyufiz6QM1f+Z+J/4uv/AKrPm/1C51lqlt/+8rn4s7qzu/kIvcvYjO2JuO5XsSQKO5CpBA9s6MNrr50wrT4z/B0v7b9B6me2dFv9fPpu/TUWB/h6SS6ry+ilfnF54InuZNGT0pv3KmJTEOQMbj4+Z8+viYUdf9eRuvy2n+M+gm4918z59vEvL6+68/q2n+M6ry4tw40DaIymjA7gACSUnBQEeh+pomlvqbob2z7A/wCEWz8qdvc/V0RVPUvQ3r+r2B/wi2T0I5fSDO5Z7Ep5+wy2bMnqID5G6kICNRwXj5FI1uQEimNJVJQcv5HWr4h2mref+ErqHdricvy27i1PrTSdljhPxp4CrM/Cn1TwlCbrvZFiKVHyCNB9i4rti1Uu9C/AzjY/lwCdODtJ/sXVT9zg/q3Zs8wAUImyCYn7hwBTKhRco37mMmSf1kBsU+DHmNy/iep2Arb+iw7w9ylfvq7htBTk1bfBm+rqnqvR2+hwT++q4bSE4Mp5emOFbgRLkjYI6XgNwR8orhgJ7BKBO5SCRPI7FJO/sUEiNFkJyAbgnDMjHhgVRI4knlLPICJOnfxStE4jWXhbzS7hk/Nk2JozKqqlTFNumqfxO4m8e5xT4pdMXdZeHrqDkmHo8+Jx+T37NtJS/M6YQR8/lH5lv3opf6DLgwsYa7g7deHvP9esXbliqfWip0/xGZq888hCtEK5WfY/izqnzZXiXvTVboddNS5TP7eTCqxTiP1qr82v6rQXh9BXhr13h+o3RDR+dYVfrVzAW7Mpypt0qh/ppOT1J06+FvrDC554VcmyizW68Tk9+7Zv948925Uv0HcZcIxemB77DgLgTIUiRsNxxyBEisShwBQRORIDsE+wbCXfuAaKSHIakINwOXJSBRsIR6iAD3QQkP8AQBT1bqlmFWVdNdW42iry3MNlGLu0v3ps1tfge0nXfx4a7udOvDJrDNqLrtfSWqMEmv8A6r+ja/vhCNFrzfEagxOMzPFy8RjcTXiqnV3825l3PDgaIwGETe6s0pnmbn5mzzzyFIhyw5TuZU0y0vVkakjqdFFVS/Y0ur7kFd//AIOum7mL6h9R89xOFnD0YLDYbDX2uK6blxVQ/k0bV6VHHB0i+Epp61hPDJVm9Vn6PF47OMWqqmo81CdLp/Fnd5LcxmXoiPA2JLG47h0NqBwEHvsAncRBQBEGOGxOwEjYqQTkj3YDllYhhOQHsRzsVgAlBSSGEUxdMyWNxygNT/xcOkL07rrTfUjD0xhc1X6m4q3ZtuKXRS6vPU1tu3yzoQl5fq8tG+nxhdHqOtPQTVOn6KLdONeGqvYa/cpn6OqmKm17tUwaD8Hcqqw1Kup036PqXVUmmqvRo7rLK8erziBG4O2ZtAACBVE7kgsoDv78ITqXdyvXGs9AV/R2cDjbf6q2aqmk6q06LflXrtOxtXW/eT58vDZ1Fp6TeIDQmqMTiasNluGzG3bxqpceazu2n7TB9AmW4ujH4HD4q1/S79um7R+9qUr8TKY8vRWcw/qex0o+Kt1XWiPD3Vp/CYp4bOM/xVm3ZdLh1WqblKur+1qO61Tnk06/FY6l16x8QuXaVpVF/LdN4Km7Tcoaf65eoTa+x0iOVmcQ6YUWvoabduW1bpVCfyMyQ3z8ymrzr+BCgIAQEpAu25z34Fujr60eJPIMLicEsbkOSNY/Md48qaqVv+/pRwE35KaqnxSnU/s3NsnwmujVGkukmZa5xmDuYXOdRX3TTVX+zwi8tdpr7aqjmfENKRmXfG3SqKFStklC+RnHciW3BUZtzmRwN5gPgIc7hEbMgqcMxr7GUfcY19gNDHjnX+jF6pT/AL/tfwFs4R7nN3joTfjI6pd1+XWv4C2cIRBrHDz25UheexCuQpE5KEGJ2EwEB+3oKlV9QtHU+ue4Ff8ATUn0V5Hb8mWYKn0sUL+9R863Tn63VDQ9D/ZZ/gf4ek+i7LaPJhLFK7WqV+gzs3pw/s2I0VLYTuctD3YbInDKwDcBzIE7gIgPfYTBHuEflao0zlusMgx2S5vg7ePy3G2/or+Gu0qqm5TzDT27HFf8x10f8qp/kByfb/gluf8AqnNK2ZWFcK/zHXR9f/AOT/8ANLf+KT+Y56Pty9BZP/zS3/inNb3ZN5COFf5jno+//gLJ/wDmtv8AxQvBx0fX/wAA5O/nhLf+Kc1RuXmAOE34Oej7anQOT/8ANbf+KX+Y46PNR/IFk/8AzS3/AIpzU+SzAHCX8xv0eSaWgso/5rb/AMU/d0P4benXTnUlnPtO6VwGU5pat12qcRhrNFFSpq/OWyXocnyJAJFSncm5UoQVScIJBpsCTDOlXxc4fhDvL/7/AID8azurwjpX8XNT4RLv9f8AAfjWElp4sf0uhR+xX4GaUGFna3RG/wBVfgeQ2eYn1DAaAfIP3C7BrsEOC2/z6Y9USTKjaun5gbMfg9r/ADG1t/x7/hDZKzW18Hv/AFH1t/x7/hDZLO5lPL0xwkj5lb7BIjoiOCLhmRJAkFiCmKIP5c22y7E/8VX/ANVnzdZy/PqzU7/+5XPxZ9ImbJ/qbiv+Kr/6rPm7zZTqrUrnb9Urm/2s0qyu8BDLZJmK3O2SgjHcCk9RMFYREe29GNut/Th93qHA/wANSep8ntPRht9eumlPZ6hwX8PSSeHUcvoroey+Rk5klKhmT4MnoFElJMEb39wrG5+x+Z8+viW26+a8/q6n+M+gmtT5fmfPv4l/9f3Xkf79p/jOq8uLcOM1uygGjzouSggUA7gIqWx+romlLqZoZ/8A37A/4RbPym4R+poir/PL0N/X7A/4RbJPCxzD6QqeSwSnkrMnqHt8gnI3ExyQUi2D4EFCIDcQUnICGzj7r9gv1R6O6wwtS81N3LbtLX2HIPEnqvU+0sRoLPrTUqrCVpgfOndtfQX79EL6uJvqPlcZPkf05tSqM0zCldsdiV/0tR/MavLPKBlIVD2BQAQWzQHcDYh8G2P5Luq/9TYD8bhtFXCNXXwbf/W7qsv+DYD8bhtFSaRlPL014VqCoPsJ3I6GNtykgAgykbAc7oj9ysb+oQSHJSbgI2DWxQFR/oHAjcRuAR4cVYt4i3Vbu0qu3WvLVS+GjzGNxS0B84uvsuxGS9SNZ5fibTtV2M4xNSpaiKar1dS/QficHPfj1yTDaW8XOussw1CotXFhr6Uct2lVV+lnAqlpGscPNblAO4grk4I35Wn6FkxrU0uGBso+DVn9nB5N1KyC9fbxDx2Gv2LTfFCt1uqPtqRswoexpm+FJnWJwXizxGWefy4LHZJib9VL4qqo+jS/Fm5mkynl6a8KycFESR0IcMfIoEakkyVFIJ3gL1DUiNighG4XPsI3ApO4kJyATkoI2AYTlCPULZsA9wH6hADpF8WHVdjA+Ge7klytK7mmYYbyUvlq3eob/E7uuqJNZvxl8ZXby3pjgbb/AFvEYnFV1r979G0WHNuGtu7QrV2qhcU/VRIM7jbuV1cyzBmrzAfIYYB+knhxl5WcHfqqaU0VUr3bUI80Lk/syLLKc91Hp/Kql/p/NsHhvsqvU0v8RPiFjlva8FeksLpDwydP8PhaPJTicss424o/Z3LdLqOcVseudPdOU6P0TkWR0pKjLsFawyj9zSl/Eexoxek9Qg5bC2CiD2KSAC/SO4D7AIKCcAANmNoIG7XISC4GyKKTeeRO42AoJ9o9gKThDgkP5gePE2aMTYrtXEq7ddLpqpfDT2aNE3jo6RPoz4ltS4SmxawmU55cqzXLrFmlqmi3VV5VSv7Vm95o6FfFj6L3dWdKcv13lmCt1Y7TF13sbiXPm/JY8qp+XmrksThzaMw1Pe/Ykr0MaWq0qqX5qKuH6mRq85yOxYkBEYj1A7geHG2/yjCXrdKdVflmj5m+/wAG3U291b8OmjtQ4qr+jLuFVq7RMul0N0qfspNC1H1bir7o2VfB96mWLOV6z0FjcdXfx1vFUYrA2KmoosK39eP7Ko4s1pPo2K6t1FhtI6ZzXO8Z/pTLsNcxV1/uaKXU/wBCPnb13qy/r7X+qdR38VcxX6oZniarVd1y1ZV2p218lS0bmfiMdVr3S/wwZ/fwtSeJzaunKVb7ui9TXTUzSPYtUWcPZt0U+SKKfMl+2jclVuzkNF7RyQ0ZCRQEBe3JAI82y5eyCP1NI6XxeutYaf07gsNdxd3M8das10WlLVvz0/SP+1bPof6daJwfTnRGSaZy/wD0llWEt4S1t+xoUI1TfCh6RPWXWXONcYuzcowen8OrWEqqpX0d27X5qLke6hG3yjjmWZS9FYxC8AFI6QduQxAVEtzIkbhgEyV7wVqODGrZII0MeOVx4x+qi7fl9r/B7Zwi9zm3xzf7Mbqp3/o+1/g9s4SXBrHDC3KAqBXIBygRELI9AUfv9Nmn1X0Ev/v+B/h6D6LsF/SLX7yn8D50emdP+e1oF8f5v4H+HoPowwamxa/eL8DOzenD+hPf2BPsKpk5aI+SjaR8wIvcpO0B7ewGRICKECewnYk7hVewjb3D3KBE9ikhML3AB7jkRH2gT5lSXIaki/8A4QFc9mE4W4jb0GzAc9x2C5Hr3CJydK/i5v8A0Il3+v2A/Gs7qztJ0r+Lnv4RL39f8B+NYglp4sr6lH71fgZowsr9bo7fVX4GaNnlAHsOz7gAueSIyAhlR+fT80YzDRnRvXT80Bsw+D05ynW//Hv+ENkpra+D3/qRrf8A49/whslTMp5emOE7lmSkjc5U5A2QakqpMFS3DHCA/kzdxlmM9rNf/VZ83GOmrPc7uPi5j7tUr9+z6NNbZtRkulM3xtxqmizha623wtoPnLv1qrFYu52uYm9Uv+UqOq8s7vG36EDq7Be5owQBhbhSCvgAIiPc+hGEeM8Q3TO1T2zrDXH/AGN6g9M2RzL4Nsj/AFd8Umg7Xkdz6KurEQu3krockl1XzLfijJqTx2nMz6nlMnoQRMh7ifvCsK+3zPn28StU9fdef1bT/GfQTXvHzPn18StUdfNef1dT/GdRy4tw41JyVciIfsaPOk7lIJCnJSIoGNThH6uh2/5Zeh1/9+wH+EWz8tqUfq6JSXUvQ39fsB/hFsk8Ecw+kJcl4RF+cUyepSR6lI1ICNvUTAADuG4HCDAc/M9b6g0+bR2cJ98NUexrk9d6guNHZy9tsNWB862cKM5zT+r8V/C1H8h/VnD/AM2s0/q/FfwtR/Lsaw8s8hCkKigkSV+wCeRARVE8AbEPg3P/ANL+qv8AUuA/G4bReyNXXwb1/wCl/VX+pcB+Nw2i07qTKeXprwrUhzI4KRU4KYtTwXdIBx8ifpLO8FCpIncNCAikj0HzJMoC7r3KTeAgpJSfaFwEUwubJ/IzI1IVp7+K/oezpvxBZDqBKmmvPsBddTS3btq3Qp+86Wrjk2OfGS0vfxdfTvUNCas4J3cLXUv/AKlyj/FNcflXnqSbcNmleGF+UD3DSnYM6ZhGpRRMdgrmLwa62u6G8UmgcTZrdDxt39Ta2nEq7doUfoN+lHB86vSDH2sj6waCza4/LTg8+wlxt8Qrib/A+iDK8ZTmOX4bFUP6t+zRdXyqSf8AGZ25bU4f17IpEkJ3OWgGO4akAh29B2HIQcgNwGAXLECd4KFCRA5QmAKSdykApI3CZQJO4neCRuVASpfVZqf+LnqVZj1V0XkPmT/IMPev+WePPbp/8DbBUzSv8UfE3cT4ysXZ8zdnDZNhGlPeq3V/4Fhxbh1SS2Xcjcl4UIjNXnOwW5CgJXByP4bND19QPEJoDKrab+jx1OOqSU7Wa6a/4jjZ99jtL8MbKq8d4y8lu1WvPhsHlmMdTalJ1WHH6USeHVeW7Kl7P5mScolO6kvmMnpBO4TkJKQCD3CclCJMbBuCkqCkhtjhDsgJwWCJ7ljcCdywGtxMAOWGg937hL1AJQJQe4lICMr2ImkWQDPWeo+jMB1C0NnenMzsLFYHMcNVZuWquKu6/SkezOTFgfOJrrSGP6ca81FpLNLSsY7JsbVh6rafFL+uufapH4p3g+K10WWjOrmS6+y7COnLtQUO1mGJbcflTqin+8oOkHqaxPh5rRiU3D5BCuVBOxewFdLg7AeAXqJd6b+KzSVdunzW89f6k3XOydytb/oOvrcbH6ukNR3dHawyHPrPm8+WY63i5p5il9iTHhYnEu9vxf8AX/6p600To3BY79Yw9m9isdhk9vOqqKrba+TZr+ltts5T8U/U7AdZ+uubasyu7evYC9gsHat/TUulqumxRTc2f7pM4sjyokRh3ackbAA6Zg5ZOSoCs8OKrdvD3Po06rlS8lCp5dT4S+08u0HLXhJ6S4jrV4jdI6fswrOEvrNMT56U6HTYqpueVztuk1BJ8LEZnDbf4BOj9PR7w1aZwFxq5jMyo/VW9cqoSrTvKmvyP5SdjlB4sLh7eEw9uxZt02rNulUUUUKFSlwkjy8GT0khb7iUOwUZSQIcgI3EjZh7AJ5Ma3wZQY1rgDQv45l/oxuqf9X2v4C2cJLY5t8c7/0Y3VRf8Ptf4PbOEUoNY4ee3K8MBmK25K4Zdidh8g5CqAJCP3+mr/z2NBf1/wAD/D0H0X4JP6C1+8p/A+c/pv8A66+go/8An+B/h6D6L8F/pe1/xdP4GduW9OH9XKKYpdjI5aMW4ZYkd2ThgWN5I9+CyRgXhBOUJD3YBPcARADuUEe4Qj7B+AbhCHAUmNikgSAbAW4W6IKSAuAyojX2F7CNhMbBRrY6VfFy28Il3+v+A/Gs7qrdnSr4um/hCvR/8/wH41hJaebC/WqH+5R5I3MLX9Ktr9yvwMjZ5hwNuA1LCQE9DIncIIcmVufNT80YmVH59PzQGzD4PX+pWt/T6Z/whsl9Ua2fg+f6ka3/AOOf8IbJ+TKeXqjgT7FI0JIqJSioPgJARsNwZEYHBXjb1TVpHwtdR8xtXabeKt5XWrCdUOqrzU7L9JoXwqrWFtK7/TEm3825/jNm/wAX7q1bt5Jpbpxg8Rcs43G33jcWqE/LVh/LVTDf76DWdVz+g7qxvJzuASTtkNSIgrACNg+AAqQdoPhlYW3mXjLyOzdpVdNjKMdc+T8tLR1gbk7y/CU0FXmnWrU2q6bfmt5VhvyV3P2ru23t/enM8Oq8tuFLMzCin6qMzNunD+YncnLZZXYKwr5XzPn18Sq/z/def1cv4z6Cq+afmfPr4lV/n+68/q6n+M6ry4tw41IxuU0ecIGOQqwTYoAI/U0V/rl6H/r9gP8ACLZ+XyfqaI26l6HX/wB+wP8AhFsnoRzD6QafzvsMmYpbv5GXYyekW4kR3C5YVQRlIIt9yJ7laknsUOWet9Qv/U3Of6mqPZFyet9RY/kMzr+pawPnXzj/AFZzSf8Af+K/haj+U/qzf/VjM/6vxX8LUfy1bo1h5Z5OAyLZ+xXuVETKThDsBewXIC5A2JfBvTer+qr/AOC4D8bhtEScI1d/Bu/9b+q/9S4D8bhtFX5plPL014gbgSIKR0nBSMNzwAiPcNwSYESBVuSeSxLKBE5ESCJywLHuRP7RwyoCNQJkvG49wKCcoJQB0l+LdltF7wqvG02vPiMNneCdNcb00zW3+BqDtV+dU1x+dSqvvN5/jz0h/Jn4ZNY4X6P6RYSxVjYjj6O3W5NF1hzh8O1x9FR+B3VjdlVyyFfJDtkLkPsAB/PjsbcwOHt4qzU6L2Hv0Xqal2dMs+jPpRiasZ0u0diK6vNXeybB11P1bsUNnzmZjbVzL8UvS1VV+g38eETV1Ws/D/o3HupV+TBW8NK/+nRTT/EZ2bU4cz8CNyexVsjlqpHyGSJAyBIki5AsTyFsGI7gPcpG9tiQwi8BhIbhSdymL3ZY23AfMcCRIQTkccE7+o4CsbjhKPU0b/EJz6nUHi01TiKXKs4LC4ef3vmRvIuKYj1Pnz8S2d/q/wCIjqDiPN5vo8fcw8/vLtaOq8s78OOfSWYiNgzRgAEn2AsS4O/vwgtOWM46ka8zxpO7luHw9mjb9vTcpf4HQKhea7Qv3SNl/wAGrTdzA6Z1/ndcunH4u3Zpf/F13F/Gc24aU5bJ6U1SkX19CkZm2FwE4YgnIUT2MiJFAjW4bgpOQCciIHAQB/MnzK1LDAKQwk0JATuUnIYCdw3AQaQEbMgRcAGSDIgR1x8e/RajrV4cdSYCzh68Vm+W2a8fllq22nViKaWqeOfzmaNKFX5WrlH0d23U7ddDe9NVLhr70fStXSqoXbvJoQ8YPSB9EPELqbIrOHu28qxt147A3bj2uUuHXH9lUd1lneHDS2QCc08CNjtiDgncrQE5LTVD34iCdwFZbLhEexB3AAQAi9pHLIpfYsbgTz00y6nFK3fyNoXwiukFeB0Vn/UfMLNq5czjEfk2BrdC+ktUWnVRXD5iqUaxsp0/jNW53luQZclXmOb4q3gbFL9bj8v4wfQp0P6c4LpV0u05pvBYWnB04TBWlft0LZ3nRT9I9vWqTizWker3ulbQF6BzI7nDYgoJG4FJJSchBKA2EOQpE8kr7F5JVtAGhbxz/wCzI6qf1fa/gLZwiuDm3xzv/RkdU5/3/a/we2cJyaxw89uTghSPZlcC3E9h2AVe5E5EDgI9g6auerGg1H/v/A/w9B9F+ChYe0n+0p/A+dDpo/8APY0F/X/A/wAPQfRjg98Pan9pT+BnblvTh52pDfKI+S9tzlocKSPsZEYEaL+ATkN7gF6iQuNh8iAtycF4+0dyieslX6AnIccAHKC9R5igSdwhA4ICHcL5DcBECNyk7QUE5D4HlC2QE7HSr4ubnwh3v6/4D8azus+DpV8XCmfCJcXH+b+A/GsJLT1aadq37Ur8DMwsr9bof7lGZs8qJ9h3DIkBeB6hh7hROTKjeun5oxLQkrlDnugNmPwfP9Sdbp/7u/4Q2Sp7GtP4RuY4XK8i1rdxeLw2ForxFSpqv3qaJ+v7s2JvWWRP/wB9Zd/zu3/4mU8vRHD9lvYqSPxXrHI52znLn/8Atdv/AMSPWORLd51lyS9cZb/8SOn7SqHmR67d6haXs/03UmT2o/b4+0v+0era28R3Tfp/l9WNzjWGVW7FKluxiKbz+6htgcluqN52OPut/WnTvQvp7mmqdRZhawmHwlp1W7LqX0t+vZKmijmpy1wntudTOs3xaOnumMN+S6DwGJ1njr1FVNOIonD2rFcfVdSro+sp7J9jWv1m67a58Q2e2c21zmaxdVmp14fL8PS6MNYqfLVDb3hxJYjLibYfy9Yequb9cupeda2zi5e+lzC9VVhsNduOpYaz2opXZSphRyenrbkzblyYGseGMzkJG5SSEO4gpAKVJE5XuVbAKIdaT4k2jfB10fiso6aa11BiE/oM5x1pWamtmrX0lLh/aas8fe/J8FiLicOm2/LPr2N7ngW6Y4jpN4adJ5Hi6lXfu26sc6ko2vRcX/WOLS0pDn5JxzsZSI2Gxw2EIHJQPHdnb5nz6+JXbr5rz+raf4z6Crj3p+Z8+viVc9fNd/1av4zqvLi3DjUgKt/Y0ecIhBQoAO4Dufp6In+WXoef/n2B/wAItn5jP1dD/wCuVoed/wDN7A/4RbIRy+kCmZZktpJTyX5mT1E7Ak7l7oAguBO4Aj7FlES3LCAiR631DU6Mzr1/Jaz2RfoPW+oX/qbnW3/stYHzr5v/AKs5n/V+K/haj+WZR/Vm/wDqzmf9X4r+GqP5eEaw808o3BSCCodykL2CHYdwANiPwblOr+q3b+hcB+Nw2i9uTV38G5xq/qt/UuA/G4bRNoMp5emvCqWUiiZHHJHQ2EoIueDIIEmOSkhMKFJ+A4ACPQSEEOw7DkcATcvbcNiQCKABxx4jMJVjeg3ULD0Ka7uRYylfN2aoPnkypXKcDRTd3rt11Wn/AGLg+kLXmU/q/o/Osta+ri8FdstfvqWv4z5087wH6k6kz/ArjDZvjLMfvb1S/iOqs78P43yCA0YqPfuA+AML1H0tm7R+2odJuj+Fvj7mP8IWn67tTqrox2Mty/Sm5CNMNve5SuzcG3n4TWoreO8M1OU0ua8BmeJdX9ndqa/A4s1o7tz6lkx7mSOGqk4KAqfaH6iEAHKHIjccAI3DDYjgA2xvBSTv7AUjfoUi2YETbLwIQjYAthHoOQ3CAwrcNNnzn9V6nc6y9RLj3VWocck/liKz6Jc6xX5FluLvv/arFdf3KT51OoOIWM6h6xxP+659j6/vvVM6ryzvw/Bb2AnYkGjBQuSL5lIJ9IrT872VP1mbgfhKZbZo8KOHzChJXcVnGOVT9VTecfiae8SpwmKfpZrf6Ddh8NHTb0r4UNN4R073cRiMT/btVfxnNmtHawgQbg4bDJHcrewXAE+RW+wgBDtuTnjYvL9icBVXuHtA7DsAnsRcjcfiBZItirgMAw90HAfAE4LMk7epZAJlJ3HHcBMDefYMAGpNeXxdejDz7QeQ9R8LRcvY3ILiwdy1aX+0XKvNXU/ZeVGw39J6f1c0BY6p9N9RaTxNSt2c3wVzCO5G9HmpiV8pCS+damrzxUvzakqkvmZdj+/Uem8To3VOeafxdNym/lWNvYb9dUN0U3KqaH9qSZ/AbcvNMYGAxO5EAF3DUFBAABwRF7EAvcEfB4sRiVg7FzENSrVPmj1A7bfDO6K/y0vEP/JFmOApxmn9L2XUrrplUYt+Wu0/mvLUbpqE0t3J1I+Gn0S/lReHzCY7F4K5gs+1FWsbjqLihtJ1K0/7SpHbefYymXpiMQNllrkJCJI6O4W3I4G7ATKCUD7A92EO4EhgCVOYKtkSrsRWhbxzL/Rj9U2/9/2v4C2cIzsc2+Odx4yOqe3/ALfa/gLZwknJvHDz25JBUA5Tn2C2RSAWQQII/f6aqerOgf6/4H+HoPoxwf8Apa1+8X4Hzn9NP9dnQM//AD/A/wAPQfRjhP8AS9r94vwM7ct6cPO3AJKZUcuxdyk9SKZCqh34JMdhLkCiBIkBwikmRwAn2DgNMATllWz5CX3jkAI2EfeIICmeRDHPYR7lAQUx49wjIAkSgE7HSr4uP+xDu/1/wH41ndTidjpZ8XJJeES7vt+r+A/GsQS082nNuj96jPkws/0uj96vwMjZ5k4kseobgkgURvyF2ADtyZKpoxj7yt7gf2Zdnea5NRet5dm+Oy61f3uW8Lc8tNffc8y1Rnzf/rFm3/Ln5vAC5l+o9Wag7ajzb/lzx3NUZ9dTpq1FmtVNWzTvn54Id0v58xwt3Nl/RmPxmK7/AK7XJ/PYyPAWaYeFt1v1rUs/QJ2KZlKaPo6fJT9W3wqVwixHcfnAIvmghQAIUBE4KAluFEzKSRySv83mPmB7l0Y6eXerPV/R+klha8Th8fmFp4pUKfJYVSVdT9lJ9CuQ5TbyPJMvy2z/AEnBYe3hrf72ilUr9CNYPwjeh+Jx+o8/6qZjav4e1YtvLstou0r6O/brSdddPfaqiDadTsvQztPl6KxiBJhQUxZy6ZEYXoOSDCtS18z59PEsv8/3Xb/4av4z6C7n7H5nz6+JXfr7rxf8Np/jO68uLcONFwBtJTR50BQAIVbe5AKfqaHc9TNDf1+wP+EWz8uD9PQ8rqZoeP8A59gf8ItkWOYfSGvzmVPdkpW5YRk9JAallAVHwPcexQiSGUlQUbPWuoe2jM5/qWs9kfJ651C30ZnP9S1hHzrZv/qxme//ALfiv4ao/lnY/pzj/VrM/wCr8V/DVH8xrDzTygmRyxwVB7FkhQAXuAgrYj8G/fV/VV/8FwH43DaJEmrr4Nqf8l3Vb+psB+Nw2jU7GU8vRXhWoJy9yyG9iKpIJuyyAlMjcFgchUUlnccCNwEBclJ6wAWwe4XuACQ9SkjcAuBMhBuCDCulXKWmpTUQfOJ1Bq8vVXqDZ7W9Q49pek4m4fR3W2ko7s+eHrtkL0/126hYapOnz5pevw/3d6tndeWd+HpEyVbBrkhowWfsDlkKFWhxXT8zZz8G3M/ynQeuMD5t8LjbdUenmdxmsVcpmx/4ML+jo6rUbQr+CaX9jcObcO6ctnEb8Bc8Epbakq4M253E7wBsiCMcwiuGJXJQQTkL1KAMfUsgAhEjsJgCmPPYyJwtgC2Q3kpHwA824YWyC42A9b6jYh4TQeor6cfR5diK/uttnzq5tifyvOc5vcu5meKrn53Gz6GutOI/JukOtb3e3kuMq+6zUfOngb7xNGIuv/bMVdr++qTqrO/D+juUjRTRgAAK8eNqVGXYpt82ql+g+gfwxZHb0/0I0Nh7VPlprynC33CjeuzQ2fPfnbq/Uq75eaqlR959F3RG39F0b0HQ1DWQYBf/APPbM7NaPdk5DUiNw1ujlod/YRIncoVO5QAIkGpE7BgHwFxA7BoCkjcj33KBSNSO44ANSONhI5AdyLZmQAnBJKvQNAT0ZUgnIiO4FPHVsn6mae5HT9oRpz+Kj0jWgOu+A1hZapy7VNjy1WbdKVNu5apooTfvU6mzpo004e8bG7v4g/Q3+XT4eM6t4ZUW81ydfqpZvulOpU2VVXVQp9YRpAsXHew9utz54itNcVd0aV4Y3jEvJJSc+xeUdM0LOwAEKQu6YVO5EZE3CI35YbPf+gPSx9betekNG14e7ey/H4228fctUz9Fh5iqp+x6A6ZaW7NjnwhejNOIxOp+p2PsXrN5VrL8vV23FF2zVSqqq6W/SpNbEmcO6xmWy3Icps5BkuAy3DpfQYPD28PRtG1FKpX4H6HOxEkkOWZPQNlnYLgkbkFW4neBI5gqD9B3KQKJQN3yJ3C4Aj2RKnEGSJVTMewGhbxzf7Mfqp/V9r+AtnCKObvHPt4yOqi7/l9r/B7Zwj+g1jh57cqgIkhXJxwHwUBAg7lA9g6awurGgX3/AFfwP8PQfRfg1OHtfvKfwPnQ6aUz1Y0DH/z/AAP8PQfRfhFGHtfvKfwM7ct6cPO1BVsguBJy0RcyZEQmAEDuF6hgFvuTgrcFAkSCkncBI4QXcicsCrfcpI2EbgI7oT94aCUwBSNlMWBkRKAkJ3AN9hwhG45kCTKZ0r+Lmv8AQh3l/wDf8B+NZ3UjZnSz4un+xDvf1/wH41hGnmyv1q3P7VfgZyYYfa1b9fKvwMzZ5WLLE/IeogKcbgBKAKRod5LIAj2DiBAQ3+wqBApA7CILyEY+hfkOeRG4VQGhGwQ7EkpICqJJwZR6kCftPaOl3SnPOt/UPJ9E5BYqrxeZXaaLt+H5MPab3uVtcKe/ueuZfgMbnObYLKcqwl3Ms2x1xWcLgsPQ6rl2t+iW8c/cbmfAT4MrPhz0es81BUsZrrOKFcxmydGDTSX0Vt/slsnMJy2SZ8O6xl2E6QdMcp6QdO8k0rk2Et4TCZfh6bbotcOvmty93NTb+090aARm2UkyGIlBRk7yXdlA8db3XzPn18Sm/XzXnr+W0/xn0E18r5nz7eJT/X815P8Av1fxlry4tw40DE9gavOBhFYUQCHIQbP1NDtfyzNDdv8AN7A/4RbPyn8j9XRC/wA8zQ07f5vYH/CLZPRY5fSEuSwRfnMrMnqPYRsI3EgEikT3G/IFMdyz6CSCcs9a6jf+pWd/1LWezbJnrXUZzorOv6lrKPnWzfbOcz/q/FfwtR/Mz+nNv9Wsz/q/E/wtR/KzWHlnk42QEwNuSoSUTG5JAq7hcoTuO5FbEPg3/wDrh1V/qXAfjcNosbSau/g3qNYdVf6lwH43DaL6Gc8vRXiF4WxOXBY3E7kUhhIoAjECNw3AUSgpAQUiUCd9xsvtKKRqSkncBwwxzsE/uAoInI5YR473FO3dGiXx15T+onik1nYVPl89vD3oj9t5mb3alsjSP8TG0sH4y9SWEoVeV4Cv/o2yxy5tw6wLhDksJIiNXnI2CYneBDQA2I/B7zBYXUvUfA8fTrCVx8qKzXfGzO9/wlcfTY6yarwkxVewtupL5W6jmXdOW2ajdIzMKJ8qMpjYzbj4HIW7D4CjWw7BLYQAXBSNwFuBQRlAjUiBO4kCk7h77FAjlBbkbkq4ANSR8GRi1AHoPX2ry9DuoTW0ZBjn/wBBWfOzk3+p1v1bbPoi8QLjoX1E/wD5fx38BWfO7lFLWX2ZfNK/A7qy1OH924JOxTtiBDkAR4b8ruYOylP0uNs0R86j6L+ltn8m6aaRsr/a8nwdEfKzQj538jt/S53ktHPmzTDKP7M+inQVH0eitP08NZbhl/0VJnZtTh7BuEoKSNzlqRuJgMIAg1JSTuBSMNCJAoIlDABpsTBSAOUI2EKR3AkFDQjYIFJI3+0KNhopHx6gGpQ34EiNwHb0YTkNBMD+fMcDZzPBX8JiLdN7D36HauW6lKqpahp/YaBPFP0gxnQ7xAar0vinR9DfvVZphFbSVNNq9XVXTSo9FB9AVXBrk+Lv0bqxukci6mZfZs2rmUXlhcwu+Vee7Rdqootqedt/UsThxaMw1icgic7pynwZJGrzpvAEqAwAEbBoBGxEpRSMC28FiM1xWHy7B2ruIxuNu04exbs0uquqp+iW/En0FeHDpXhejXRfS2lMK1XRgcHSqrjpiqqqqanPdv60bmqX4Z/RD+Wt4gLWpMdYvUZTpJLG2bvlbtXsQqlT5H2f1am49jdLRSkkkoS9DOzekYhVJf0B7CEctEgrUjf1CUMAkkRyywFs4AdiNfcV8+wjYBsikjYPcIpjV2KzGvsFaF/HR/syuqf9X2v4C2cIyznDxzr/AEY/VR/8Ptf4PbOD+ZNYee3KrdEjuVEjcrhQCL3Ao7Bk4A9h6aP/AD2dAx/8/wAD/D0H0X4Pexaf7in8D5zum3+utoNz/wC/8D/D0H0YYJzhrP7yn8DO3LenD+neRJSd9jlocMpIKBGNxyADexEmglDKQOw42DG5RI5C5CUoOQL9uwkRtAfAEbLuOyJzEgXeA2I+4jQF3kcMcIcgUkiZD5QQfB0q+Llt4RLye/8Am/gPxrO6jbOlnxdH/oQ7v9f8B+NYglp6s/0u3+9X4GUHjtN/RUfvV+BmbPKNAMAC8kX4DhgGVbIiLCAkeo5MoEc9oAx78lJvJeGFQFiBG4BCIGy7ET3CKCTuyN1J7S/kgrKdgYutJ71U0bfsqkj+vIskzfVOLt4fIsnzDO71dym0lg8LXXQqm4U1JNL7SERl/KpfB+5ofRWf9S9T4bT+lcrv5xmV5pP6C3VVbsp8VV1pNUrnk7ddBPhZ686gXrGY9QsVRpTJn5bn5DZarv36G+PPRV9Vx6rubNeinh20L4f8kWW6Oya3g5pVFzGXVTXibqXCruQnV9pz3NIp7uCPBD4C8q8O+BeptU0YfOtfY22vPdrpVdrAqU/JaTlKpNfn0w4bR3Cp2gqpRUcNhyJ3DG/dgUE+ZSCFIxEwUYXN2vmfPr4ll/n+68/q2n+M+gq5zT8z59vEpv1914/+G0/xnVXF+HGhPmOCmjBC9yJJDuEUhQBGfq6HX+eZob+v2B/wi2fls/T0Qo6l6Gf/AN+wP+EWySscw+kNOWXeSJzUV8GL1KRBPsUoEn7gn6hwkBTGGypQUIx4+Z611Ff/AKF516/ktZ7K+T1rqIv/AELzr+pawr52M3f+bGZP/h+K/haj+Vn9ObbZzmf9X4r+FqP5TWOHmnkcjv7AsFcseWZE4KAXO4IVOArYj8G/fV/VX+pcB+Nw2idjV38G5t6v6rf1NgPxuG0Qynl6K8Mohh/pKTmCOkhsvrAlIcb9gDkpEGBSL1G6ESA5JJeOCgCMN+gakgb+pScFKIUncNwBKt9jST8UHbxt52p5yfA/wJu23bNJfxQ1HjZzWqOcmwf8CWOXNuHVxcINSKeEV7mrzpBUjGd0ZTuEDuf8KbGKjxK5lh/90y+p/daZ0w7M7d/CuuOnxZ3LfarLLz/6JnM8NKctzdC2Re5KePYs7mbce4XACAoJ7MIB39g1JHvuVKAKCMLYBMMLuJDcMB39g4ZSJQAYU/YG9hwgHJKlKKkJ9SDjvxBf6xXUT/8Al/HfwFZ88GVQ8vsRt9VfgfRB4gv9YrqJ/wDy/jv4Cs+eDKV/mdh4/ar8DurLU4f1bFIVmjEKl3ChCZA/W0rR59Taep9c3wi/vz6JtG0q3pTJV6YCwv8Ao6T529I3Fb1Rp191nGEf/SI+iXSD8+lclq9cDYf/AEdJnbltTh+yg0GO5y0ORA4KBO4fqORIVO8lXMiJCnuAa3EFJ3ApOXAchAI3KCb7gEJC4JG/sBUO4gbcAHuiLZGRjEICpyAwA55HcPngdvQBVwdQvipNLwaal/q/A/4RSdveUdQvip/7DfUf9cMB/hFIRphw+9i04j6qPJJjbUW6fkZGzzBeSTICDe4AAIQmqvk/wD4Madqal+5f4AbWPg2VVVdBtVqqqUs7hf8AJUmwBbI1+fBpUdB9Wf17/wC6pNgiMZ5emOCZQiHJJ5Ktw6GpJLRQ19oCZCUCN/QNgGJgJ+ofPsAUh8oLbuOGA7mNe7p+ZkzCuJp+YGhnx0OPGR1U/q+1/AWzhD3ObvHNt4x+qf8AV9r+AtnCT5NY4ea3KFAKiJQUgkIpIHJQP3+nG/VPQi7/AKv4H+HpPovy9RhbKfKt0/gfOf05fk6paHrjajP8A5//AD0n0X5bc+kwdivtVbpf6DO3LenD+qWEGIg5aDHOwZNwLMBKGEpe4XMAJlBcBcAgSUx7+xWUGikh+pI3As78biZ2HcJQEFtsO4e8EchVbD4H2DnkIJwh3I/bgqCiUFJO45CEnSn4uf8AsRL39fsB+NZ3WhHSr4uP1vCJe2/9/wCA/GsDT1Zf61bn9qvwMzxWVFujb9ivwPKbPKnIKR7gJAgBRQXaUu5PsLb/AKZTvtKA996X9COoXWaxjL2itJ4vUFnCVOi9csXqKFS5jiprue8/zC/Xr/8A1jmf/ObP+Mdufg+J1ZTrheZpfTPb/wDIbJPo2n+czObTltFYw0R/zC/XqNumOZf85s/4xj/MK9e09+mOZP8A/abP+Mb3vJP7Jh23+2Y7pXshoi/mFOvbf+tjmX/ObP8AjEfgW69ULfpjmX/ObP8AjG9/6Pndk+j2/OaHdKdkNEP8w117q/N6ZZl9uIs/4xF4DvELXXT9H00xlFL73L9p/wDaN8Hk/dMvk92O6V7IaStLfDa66Z7dVOOynB5Em4dWKoVcf2tRyzkvwd9bXcVZv5v1Fym3hm07lnB4W9RX8p4NrdNtJ8b+pl5Uu3JMydsOlOg/hSdIdNYvB5hm/wCqOo8ZaSdy1j7yuWK3+9dPB2k6fdH9GdKMNcw+kNNZdp2xdh3KMBYVvzv1cfM9zhJeogmXSJKB5YLPsJkCPsOGixAiQHL9iPdFQiAo9wUx7sCv2Ejt6kggxre627nz6+Jb/X913/Vq/jPoLrfG3c+fTxL/AOv7rz+rV/Gd15cW4caCZKuCGjzrsOwADsAQA5bP1dEOepmhlHGfYH/CLZ+WuT9TRO/UzQ+3/v7Af4RbIscw+kJfnMvJFvUyrYyeoj0CUBsoAiYT9QkAbgJyGOAD7HrPUhqjROd1emErPZlueodVrjs9PtQ1+mCrYR88Gb75xmb/AOH4n+FqP5Wmf05k5zHHv1xuJf8A0tR/POxrDzTygAc+hUOAJLAVFsChbMDYh8G3/wBbuq39S4D8bhtGp/NNXHwan/6W9V/6mwH43DaNyjKeXorxCzHyHuV8BIjokSSJZdpID2Ek77hlFlopGHsBSJyRTJVyAjaCRKK/uKEYrnfkscjvwO4USgPYpHIRHv3NJ/xRYXjWzBeuT4T+BN2FRpN+KJL8bGZb8ZNg9v8A8JY5S3Dq12HYvEDsavMnJREAKHbf4Wb/ANF5tx+pd/8AgmdRzt78K7DurxZXLn7TLLy++0zmeHdOW5mgybgi4RV33kzbiclMUi+sgOUEO/sJUgG4E7kfJUoApOwneAwhz2KRBhTuUiKAI3AYiQBKi8kexBx54g6HV0K6h785Bjv4Cs+d3I6vPlVl/NH0T9faHX0P6gUrmrIccv8AoKz51tPU+XKqE+ablaO6sr8P0OSvuBxJoxEVcEEgfpacu/R6iyKrss1wz/vz6KND1efR2Q1Lvl+Hf/R0nzkWcSsFfy/EcK3j7Fc/Ko+i7pleWJ6daVvJz9JlOEr++zQzO3LanD2ZkXzKxsjhqTuJAjYoLgT6hcB8AUETkN9gDcBAcoCkjb0EFAkhblI99gD4CRJ3YiNwMjGfRFkd0QOQ+eCk4RQbTJvIYXzAq5Ab2HYBvB1C+Kn/ALDfUf8AXDAf4RSdvXwdQvipP/Qb6jf/ANwwH+EUhGmK2/qUrnYzMLX9Lp+RmbPNIAmAE7DuTuUIE5pcftX+BSLal/vX+AG1T4NO/QbVf9e/+6pNgcNNGv34Nb/ziNWf17/7qk2BqTKeXqjhEhL9CyH8yKnvwWewhPcNSAHMbBfpDe4BiZQn1HCANduwb9gnJH2QFUmFyE6fmZ87SYVrj5gaGPHLP82T1TXP9H2v4C2cJ/M5s8c00+Mvqov+HWn/ANBbOEjWOHntyLkgHuyuAch8D5AEWQAP19F3PoNdaUudqc7wVU+kXqT6K9MXPp8iy65M+bDW6v71Hzl5BdVjUeQ3W48mbYSr/pEfRToO99No7Iri3VeAsVT/AGCM7N6cPYOWH2ESGctCdwwvccAJHDEbyUCEbngvIW2wE3Eyz1Pqz1Gy/pJ04z/WGaW7t3L8nwzxN+ixT5q3Smlsu/J1Bt/Fw6SXLFNdGV6iqnusvcff5gjvYRM6K/z2/pRx+pOov7nv/GMa/i39J1VtlOov7nv/ABhgzDvW9nIk6K0/Fw6TvnKdRf3Pf+MH8W7pP2ynUT//AHe/8YuDLvUmNzoovi3dKG9so1F/c9/4xf57d0p/+T6ij+t7/wAYmDMO9aZjJ0WfxbelCp/1I1F/c9/4x750G+IRoXxAdT8HovT+W5rYx2Iw17EqvGYV26VTbSb3l+pcGXa9cCX6Ep3RSKNBKCk5RAW8ydKvi57eES8+P83sB+NZ3ViDpX8XKP5kS7/X/AfjWVJaebP9Jt/vV+BmkYWl+t0NftV+BmbPKPYgEwFCxBGwtwKWhN1U7dzEytwq6Z9UBsv+D4oyrW88/TP+ENk3Mmtj4PjbyrXH/HP+ENlCMp5eiOEXJYI3uJ7kdL3D9w90I2APgc+w57id4APYSxvPsHsEOERt+hWp7h7BSJ9gik7sCkkTJEBkTuE5kR7gByOO5I33As+xSdh6bgYVbx8z59vEx/r/AGvP6tp/jPoJr5XzPn28TG/X7Xn9W0/xnVeXFuHGi4BI2EGjzncNwCgEpBJKA4P1NE/65eh/6/YD/CLZ+Wfp6Ic9S9Df1+wP+EWyejqvMPpDiGy9vUn7JlneDJ6E29CyOWUKkbiBG4b7AOdh3JElU8gJjscfdfMfTlvRzWOKq2VnLbtX6DkGThXxoY15b4VeqWLpcVWsixFSa+QGhO9c+nvYm4v2WJv1ffcqMUoPBl/meBtTzU6qn9rk88yzZ5pG2XlkCDlfsBJLzAD9I7gqU1JAbDfgzvzas6rv0w+BX6bhtIfyg1bfBipnUnVapvZ2sGvuquG0jgynl6a8QyY4HA7EUe/ARJ+wqchRidikgCJepXygyPmAKF8gtmJgIRIa3kSI3kKpCkewRHyF3L2C3CjNJfxQap8bGbr9rk+C/gTdlUvMaS/iffW8aufVLeMowH8Eyxy4tw6vBkRY2NXnO4W8gi2Ap3T+FJgfpfEfm2K3/WcBVT99pnSw78fCQyv8p6qayx6UrD2LNE/vrdf/AIHNuGlOW16j82S+nYwobSRlCM25y2VjhBICkiNxMFAnKHcSUIkfYA1ImNgqkf3id4KQRCZEiY4KEv0I9ircQBOCthbpFA9O6vYf8r6WavsR5ndyjF0R87VSPnUt4Z4O5jbMR9Hjb9EekVQfSDrLC/luls3w8T9Lg71EfOho+dXVOG/IdV6jw3DtZxjKI+V1o6ryzvw/MBF32K91BowGFz6j5iYA/hzuryZY6k48l6ir7j6MujNTudINC18+bIcA5/8A2eg+c/NbKu5ZiU+1Lq+5H0S9BMVTi+iegq6XssiwNH3Yeg4s2o9/AIcNAIDlbhROQmRrsVOQI1vIlrsVvcoRjw/mV9ggFUiW4akNwA7gi3LEAHuTfgsEezAsBz2DZSCLeQmRyWEUGIKSdwHBFuyzuRbSBYOoXxU/9hvqT+r8B/hFJ28lo6h/FS/2G+pP64YD/CKQjTFZ3tU/IzMLUfRqPQzNnmQoJwEACgQJTS/k/wAAirZVfJ/gBtU+DSv84jVntnf/AHVJsD7mvv4NFX+cRq3+vn/dUmwT+Mynl6o4EoJMiZkuyIqkY4Y7+wBcj3C5YmWBG5BeBwtwHARJKmAjcxq28vzMnsY1REgaGfHbRHjS6oTt5sXbqX/IWzhA7E/EOyyrL/GHq++6fKsXT9KnHMUW0ddplLsaxw89uQjKQrhOUWNykW4U5RSFCPDicX+Q04fE97OLs3f7WqT6KejWLWYdJtF4qX+vZNhLn32aWfOlmdpXsuxFH7l1fcj6FfDdmVrMugvT67aq8ypyPB23HqrFCZxZvRyZIaC3EL7jh2EachclYU7jeSLZmQGO6KlAHqBwR46a6bfhF6p1PhZPX/16TQnlHmWWYV+ZpOl7T7m+Lx8XFa8HfVbeG8nrS/t6TRFgaHbwGHpfKpO6srvPL/bP7yPndv7wJ3O2Sqf2z+8S1+yf3kQ2YFTfZv7yy/2z+8icACual+c/vO0/wwKf9GZkm7beS4/n97SdWFwdp/hePzeM7Jae9OSZh/1aTmeHVOW62ncrUslPBkuTN6BJiYEjlAJ2OlXxct/CJe/r/gPxrO6kcnSv4uW3hEu/1/wH41hJaebL/WqP3q/A8iRha/pdv96vwMzZ5gkk4ZYkBMMD2ERIAztqaqfmYIyo3a+aCNmHwfFGT63f/wBd/wAIbJoexrZ+D1/qPrf/AI9/whsmZlL0xwRvIjcTuHDI6OETsV8eoYDhCIEywwDcBdyTL3LsATDD59xACR2DiSRHARYEJE7yVgSJL3HBQqEbE8+o+YFaHZCNxG4RhXMr5nz7eJffr9ruP9+0/wAZ9BVzfy/M+fTxK7dfted/6NX8Z1Xlzfhxol6gclNHnCFDAnYTuOwATufq6IS/ll6H/r9gf8Itn5aXqfqaI/1y9Dr/AO/YH/CLZJ4WvL6QeamzLlE5bK+DJ6UksjkkKQqsBKA2AE7k90VSQO/sdb/iD6is5F4SepFq6/K8dld7C0e9VVJ2PezOjHxd83vYHw3YDCYe4qa8fm1vD10zvVQ6apKNRtulUWrdK48lP4GSJTPkonlUpfoLwzZ5VAiQEQIqRAKjKhTcpXeTDujKleWtVPhMDZR8G3Ja7GWa/wA1aijFXbdpOP2lda/jNls7bnRz4Smn6MN4bbub0/n43NcXbb9qLr/8TvHMdjGXqjgaZUJexQqMPjYNSxwASCKY8MDIkbyHsw5n2Ak8lnYNEiFuQVqfkUi9Q3BQkbyRIyAkzsEmG4fsOSDGvaI9TR/8SLHU5l4wdT36f2GX4K391DRvAuOEvmaD/GbndOoPE1rbE01eZUVW7E+9LqR1XlxbhwyohFHYcGjzhByXgqiNjPwbLVGKzDqjiYl268HSn/Y3DXPQpqW28myH4L2EroyrqhimvqXsVhaV/Y/SJnNuHdOWzOlbGXC3JwXkzbnLEwx3D5AckhsobgCPmDIEgCkjeQlAfAB8lIt9yPYCpCfUIjQDlFgi4KgEQJHAjcD+fF2fyi1cttSqqXT9586fUyimz1U15YSj6LUOPUf/AJ6z6M6tnJ86XWHCVYHrl1Is1Jr/ADcxd1T+6v1s6ryzvw9Wku3YJEk0YA7CRL9QPDjFOCxVP/0an+g3z+CnUa1R4ctHYrzedW8LRh5mfzKKaf4jQxiaXXYvpfsrdVP6Dc38KbMLuY+D7Ja71TqrozPG2pfZU3ISOLNaO4XKItyph7s4bAjeR9oTkA+ZDRF7lYCEJI5LAFJPJSSA37B7hOR39wiLbYyJ3G4UI2VuCPcCpyO4gJgUiUEblmRBJhlIUojUkZZckaaAM6hfFSn+Y21J/XDAf4RSdvquDqF8VNNeDbUn9cMB/hFIhGmCxtbp+R5Jngwstu1T8jyGzzSE5A4CBSS38iuPXcAiN/Vf71/gXsSX5X2+q/wA2q/Bp36D6s9P1b/7qk2BTv7Gvv4Mz/ziNWr/AO+f91SbBF3Mp5eqOFW7kk7jcrkgMNxwER8hVXBPQr34ExsBPKViRIQ/ELgNiQo1J47i+pUjycEe6c8Aad/itaaqyPxE5Jjq0ks0yu9epa7xXTT/ABHS9P7DYF8YzKr9zqX0yzSlNYenAXcLU/eq9P8AEdAKnNdW0Q4NK8ML8oAtw20dOE7l4YEsAQoA8OJl2L6W/mtVKPsN2Xw0taXtceFPT+Nvz58Jib2AhveLXlpRpTVH1lO6ndGzv4O/UK7mmidY6KrpdFvJ8X+W0S+fpq6nt/anFmlOWxxqSRv6ETnuXl8nDVY9AhuJj5gIcidwgtwo1uGxD9SNRPoB1G+J1rGjTHha1Dg6q/I84pqwVKn85x5o/QaYqkqWkvRfgbP/AIx2f4bE9PNCaepuJYu9nH09Vud3b+irU/eavt/M5NKsbqTuXsU6ZgJ3ARQAAnZna/4WmCrveMnDYqne3YybF0P2dVtHU6uqDvf8JHStzMOr+qtQ00zawFinD1VRw7ltx+BJ4aVjy20pGRjT+al3gu5k3GxOwQnbcIJbHSr4uX+xEvL/AO/4D8azupx8jpX8XP8A2Il7v/m/gPxrBLT1af1KP3q/AzMLTi3bn9qvwMzZ5kCkTAmQgBvsICm5lRPmp+ZNy0fn0/MDZj8Hr/UfW/8Ax7/hDZJwzWz8Ht/5k63UT+vP+ENk7kynl6Y4TZsbJhclf6SKJoR6kS7lAIhZD2AkbSIngvIWwCNxIYfAEiWVck43L7ATuyrgj27jiAK1uEt5Ekj0YFgbyT7SrgCkIO5BjXyvmfPr4lP9f3Xi7/lq/jPoKucr5nz6+JXbr7rz+rV/Gd15cW4cabgJjjuzRgoA5QQEkEhV7QfqaH36laH/AK/YD/CLZ+U3D2P1dDtvqVof+v2B/wAItk9COYfSEt6n8g+QvzntBZ3MnpRuHuVbCee4jeQD2ESUBUe4bgnHJW4Axq9TVd8XvqNexet9FaNwl+i7g7OGqzDFUJ70XKbjpSf2M2i5zmdjJstxOOxV2mxhsPbd25crcJJLufPp4heqNfWzrhq7WPlu2cNjMXVRhbFypP6O2kqWlHZumftLHLi04hx+3u3BkRKEU1edE5ZSBhVkARuEVJGGJrjDYhrZ02qmvuM1yeHHWr1/DOzh6Hcv366cPRRTy3XskRY5bq/hjaVxmkfCXp3C4yl03cRi8TjEn+1uVKpfoZ2xlo488P8AlCyLoroXBfQ/QXLOS4NXKIiK/oaPN+k5D5XoZPSJyHux3DCkxyOENmO4CRMCBG3IB9gGpHYgoJ3KUT5bFIxMfMB7Beo7CNggxEDsEFSrdpHzqdX82qzrrX1ExFzlZzibKn9xfuI+iXG4q3g8PdvXGqabdDrbfoj5xteV0X+pOuMRQ5V/UGYVJruvymuDqvLO/D8gMQDRgBegK0Bbe9yj5m1P4QORvAdGdQZl9HH5bmFVPn/beSutfxmqr6T6NVVftVJuQ+FJhqKfCLlOIpUV3szxrqfrF5wc2a05dx+SDvEl7cmbZHLL7SIEAPzSbvkq27iPcA1sEoElAjHA2ZIhgVqRyGEAiCNFb9hO4DkTvBSPkB23H2iA1IGFx7faaF/GlpZ6T8TutcK6VT9P9HioXfz1V1G+p0yuDSd8Tu3TgvGVnVihQruT4Cv7fLU2WvLi/Dq03txuCwRmrzhYbJGwAtCTrpT4bhm274SGoLeK8NuIymmr62BzfFVteiruuPwNSNL+tS/RpmyL4M+ZXqsN1LyqvezhbuHvUT+7dxv8DizSjZm+Sjn5A4bEDtsSd2VJhSfvEhKBABcBKCgCck3TgvLYagCgEYFJ2DUiAG0CRzO4XADgJiBs9gAjccCQA9v0hyUDHfgqJO4XIFjbc6hfFT/2G+pJ/wB/4D/CKTt43Ox1D+Knv4N9R/1wwH+EUhJaYbS/W6I9Dy8yeKz/AEtKdoPJwbPMi4KSEUAO5EUIiHFNXyf4F4J5fq1fvX+AG1L4M6/zidW/18/7qk2DPn2NfPwZ15eg+rf6+f8AdUmwWTKeXqjhZDJwhyiKvfkkbl7wOIgBAgdw9gGyQ2C3RQJPqFwR8l4AIVcBuCPdBHQP4wGn8NT0P07qBW/Pi8FnNmz50t6bbprqf6UapeX5n+ySq+83p+O/QFjX/hf11h7lmrEYnB5fdxuFt00y3dpoapj7zRNhrzvWaKnQ7bS8jpfZ07M7r7M7vLv2KwmIlnbIAAAAAG3PLOzHw8OsNvpN4lctsZjmFGAyHUFp4TEutxTVdppasr5uupI6zyy2MTicDi8LjcJcdnGYK/RirFynmm5RUqqf0pEnytfEvpTp9PQySOungl8TeV+IrpLl16vHq7qzLbNNjNsLcaV5XEkncdP7WpzD9jsWnuZPSyBjui8+xAX3h8wFwI3koNmNTlGTOPOvPVjKuivSzPtVZtiPoLWDw1Ttqn86qt/Vphd92gjVD8UPqZguoPiVt5Pl+Irqp0thXhMVab+qsQqp/wCrUdSEfp6q1TmGvtV5zqjOLrv5pnGJqxWIrq5l7fgkfnLg1jxDz2nMsYEe5QVyhSFAnAKAq0U+a5RT61Gzn4NmQYrBaJ6hZxft1KxmOOw9Nmtrn6NXKXBrAxN2qxhr16nm1Q6180bvPhyaGxug/CxprB5nhXhswxFy9iq1UodVNdfmof3M4tLSnu7QLgNiBEbnDUgP5EmfYs7EVJnsdK/i5KPCJdn/AOf4D8azupMHSv4uW/hEvf1/wH41lSWnuhfrVv8Aer8Ckt/0q3+9X4GRs8qQHsO4akKBKBHYAEZUL61PzMTOiHXT8yjZb8Hr/UnXG230z/hDZQzWz8Hpf5k63/45/wAIbJnuYzy9McCaJ3CW5kRQx+RkSIYARtuNkGA7+w2kTsIASJTEEezAq4C+QZO2wF5J33Kth3AESaK9g3sBIjeBz3KtxwgCWwaCf3B/oA8dfK77nz7eJV/5/mvP6tX8Z9BVdK29ZPn08Ssfy/def1cv4zqri3DjRFSEbFTNGCdwWJAEkQOShEZ+podx1L0P/X7Af4RbPzGpW6P1NEJLqXoaF/7+wP8AhFsno6rzD6QlvUywT9kVsyegjcTA3koVEhO8CSOpdvvAN7Eb9w60qW3wjpl4wviF6X6MYDMtNaUxFnUOtkqrDs2a/Nbwlzh/SNb0tb9uYCZel/FC8VNGkdHXOl+nb1N3O87tu3mNdNUfk+Hc7qP2XmS+81TWrStU00UqFT6H6eotS5trPUOPz/PsfczLOcfcd3EYi65bqfZeiP4Eu/c1iMMJnJJSQCuFIUhBQAUJg5A8PmlMXrjrvoLJsLY/Kaa80sYu/biV9Fbu0uufsZx/8uTut8JvpjiNT9d831xRdV3LtO4SvBVW2k1579Ep/Y6DmeHdYzLb1gsJawdi3Zs0Ki3boVumlcJJQkeeCULaeJLJm3IH2lMZCnDK3AW4chFBNyR6sKrDDAAIPcICgkhvYIMezCJDkKvpBQRyB6R1qzWrIek2sc0ocV4PKcVepfvTbqf8R87dnH1ZpdxmNuL6+Kxl++/7Kt1fxm/vxa57ZyDw6dQL16ry03coxOHpb/bVWqkjQDhbSsYaxQlE26avvR3Vld53yA+Q47HbEBODJBXhxm2BxTT3Vmpr7jdx8NnT/wDI14T9MYNprz3r9/f93V5v4zSLmNat5fin62qqfvR9B/hr07RproforCULy015Xh78Jft7VFX8ZxZpRyauUZSmR0hbcnDZkT3EyOwEb39i8EgrUgHEj3J7MsQAfInYB+gBORIgQA7iB3KBJKSUthygg1uikY9wo9kzT/8AFh0rXg/EXkueOjy05hl6sqv9t9Hb4/SbgKt0ax/jL4f8mfS3HW6En9NjLdyuPWm2kWOXEx4a4afcjK2/PVT6MkcmrA4QjcFmAjGpqmn0O9XwlNaUZN1r1RppVRVnGDt3lT6/RW66v4zotUvNt3OyHw587saa8Y2lcbirv0drEYHGYfnZ1O15af0sk8O6z5bxafzaZ5MuYMVVKKnsZPQoXcFAx7sTLLG4gAiLdmROWAQe5STABFIwnICQwRtgJKlASD2IDcMcjlDdFBv0DH4k7gWJ5Ext3G8CZASJ23AnYIlTOoXxUv8AYcaj/rhgP8IpO3r4OoXxU/8AYcaj/q/A/wCEUgaY7X5lPyM/U8dlfrdK9jM2eZQAEABGwEmUHxV+9f4FMf2L+T/ADap8Gn/WI1Z/Xz/uqTYJwjX58Glf5xGrf6+f91SbA53Mp5emOFblBcBr0Ckjo3kJyG4HIEfPzKl6hruFwA7wJkSNpCDEhOSdwMib/YBMkV/FmmX4fNsFfweLsq/hr9Dt3LdSlVUvlM+ePrBoPMOmPVfVumczt02cRhMfcuW7a7W7lVVdP6Gj6KKm+xqn+LX0Ru5FrPIep2W4OMvxlDwWbYh17fTVVU02dv3tNR1E+XFozDoCluDKlpmLNWACIoBuNgAEJHyJwyyFe6dG+sup+geusPqjS2Jqt4mhpYjCuqLeJoX7Gpbru+xuQ8Nnjq6feIHIsEnmFnT+qK6VRiMnxtaoavRLptNua17wuGaO3SSlO1irOJsXr2Exlp+a3icLcdq7Q/VVU7nMxl3FsPpXVaqpTW6a5CrUcmhvpl44ut3SLKll2R6st5hhk1CzjD/ldyPTz3G2c7aU+LX1KyzDU059pbLs4urmuzeosT9ipZzNZad0NtrrpW8oqrT9zVTmHxfNXYiiqnB9P8Jh6/21eOpq/wCwcaao+KN13zi/ct5dfyfJMJcpdLp/I7V+tJrs9mmTEr3Q25dTOq+l+keQXc51Vm1jK8FTTU6fpa0q7jSl00JtS/b3NL3jO8ZGbeKvVdGGy5Xst6f5bdqeBwtbdFzFvdfS3FypUfVbaUHCmtNd6n6jZpdx2qNRZjndyu47itX8Rcdihvny2nU6V9h+I42UbLsuDqI92c2zwlL2ReC9kRuTtmAAIiLJPwKAWw5BUmgr9bRGjLvUjXmm9IWbjtXs8zC1hFWv2NNT8rf6T6JdHZCtM6VyXKF5f6AwVnC+alQm6Lapb/Qam/hV9FruuesWaa8xuGt4jJNO2nhLP0lKf9EV+WuiumfTy1bo2+UwuDOW9YxDyEal+wfqU5do0SexZIwG8HSv4uTjwiXu3+b2A/Gs7qp7HSv4uO/hEup8fq/gPxrCS082n+tUfvV+BmYWo+jo/er8DNGzyoPcNSADcBfoCH4AUyt7V0/NGDZlb3qpfuiwNl/wep/UrW//ABz/AIQ2TyjWx8Hl/wCZet/+Of8ACGyfaTGeXpjhGnIiPkV9hMckdKSHBQESJDiSPZh7sKvcSRr0KkAnYPgpGBJjYsSh+JPMAS9REF5HPBAj1D9ggiik5G8DggPb5Ef6Csk7lGFXK+Z8+niV/wBf3Xf9XL+M+gyty1HqfPn4lE31715/Vy/jOq8uLcONuUIgLgvY0YBAAigAge0n6Wj7tvDdQ9G4i/cosYbD51g7127W4poopv0N1N9kkmz8xkqoVaaqSafZlXOH0D/zT/SRuf5Y2nJ/rjb/APEv80/0lj/XG05/dG3/AOJ897yrCVOXZpn5IfqZhE1Fin9Bx2te99CH80/0nj/XF05/dG3/AOJKvFB0lpTb6i6c+zMLf/ifPg8uw0/0mn7jL9T8OnP0NE+6Q7U7/k3uaw8dvRfRuHqvYnWWFxtNPNOX1U36n9iqOCuoXxc+meWZVduaOynONQZnS4os4vCVYe1V/Zpv8DU4sPaX+0Wf+TRml5VFP1F6U7Idp3uy/Wn4iHV3rLaxGDw2JtaNyDE0qmrA4GpXLn/KeVVI6z1J13q71y5dv4i7U67l+9W7lyup8t1PdmT3EQdYw4mcpCKIHBUOCFADaCFAArWxIK23xsEeHF4lYHC3L9UfUplJ936G634cPROvo94e8uu5hgacJn2eVPG4uuipv6Sht1Wv72o1deEPojf8QPXjIdPLD1XsowFynMMzqqp/W3at1Uzb8z2lqrg315bl9jKcvwuCw1H0eHw1qmzboX7GmlJJfcjO0tqR4y/onYR6lDOWqTDK3AiQuAIlPJZ3HcNtAG4KRAAxMDkoEE7ifvCYD5CCkYDgSEoD2YRSbzuUjYV09+KjqPEad8JeZXcK4uYvNMLhKknzTX50zTTb/Msp8026afuRs7+MNrh5do/RulPpGv1Sxaxn0fKf0Va3/vjWNW5qqhRuzurC/KPkAHbMXJl39jGdhLVLgDDF4CrMqMPhLe9eJxNuykv3Wx9GHSzDvBdM9I4dqHZyfB29/azQv4j5++lWWU5/1U0PlVUf0ZnuEtNezuJfxn0QZLgf1MyrBYNcYexbtf2tKX8RxZtR/cuCkXAjc4aDcMSmIkPmAKCRHyKRUYkSEtgDQmOQn2DKHmQkLdBICk7DcoE5KRiI4ARBIaDWwTgIu50L+LrpB5r0OyrPvIqllWOt0uv9r9Jcop/iO+p1T+JrkWJ1B4Q9U4bCUuq9bxGFvwvSi6qn+hCCWla5CvV/vmYcHiwlf02Ew9x/nV21U2eVo2eY7BBNBegQmGe2dHM5xGnus+gMww9TodOc4WxVVS4+rcv0Uv8AQz1Jo8ljM7mS4rA5jal3MFjcPiqY7eS4qv4hPCxy+lG06XTNLTT3lGacs9G6I6kr1d0l0fnlxzXmOVYfEVT61UJ/xnvK2Zi9IyPdh7sqCkFBEtwKARpthFBEoDUhSZWweyDE7gJE7hpdhwuAKCMncIq5YnbcITIUSEbBuCPmQC5ElgPfYAmSC7kW8gVnUL4qP+w31I/+H4D/AAik7ePdHUP4qSS8G+pP64YD/CKQktMVpfrdHyM2YWWvJT8jPubPNKFDAAIDYiCI9049H+BTFxD7bP8AAo2q/Bpl9CNWe2d/91SbBO3ua/Pgz79B9W/17/7qk2BNQZTy9UcLMchPcnLLwyCP9AnZQVvcpFTcPdBqQ3BQjYRsPcLZAEoEBOQ1JAaC4DfZAqDUnGfiL6NYHrz0jz7R2OoturGWaqsLdu0+amziFS1brj2bk5M7mNdLa25A+brU2mcx0JqnN9M5vaqozHKsRXhq/NQ6PPRTU6aa0n2qSn7T882c/FE8KOM1DhqOrelsMr2a4Smmxm2Dpomu/ZSVKrT9KKaam5+w1h2rlN6hVU/mtfd7GseWFowzjYiKOSuUclnYcwAgJHKgQBZCcEDUMCppNzuid/mEIgKqq24MGp3SgyEbgSYCXILyAHIgBES9SjsAIgUPcKI8uFy7HZvjMLl2WWKsTmeNurD4azQpqqrfEI8cpJt9u7O/vwvfCnjNS6lo6uaowVNjL8vrSyOxfo+vcq2av0vsk/NT2ZJnC1jMu9nhB6F4XoF0PyDTyps1ZjXZV/G4m3b8tV65VNS83dtKqN/Q5scehKKdiyZPQcsqe8CRG8kVSRsUk7wURpI6WfFy/wBiHe/r/gPxrO6k8nSr4uK/0Il1t/8Av/AfjWISeGnq1tbtr9yvwMzC0v1uh+tK/AzSNnmTuw+CwAidkJAARHuZ0fnU+smJlbf1qfmBsv8Ag80/5la3fref8IbJma2vg9v/ADJ1v/x7/hDZLw2ZTy9UcItiyTljy7kVVvuE5EhOQHBSMSmEOJC2QnsICjbHYRvJQjGdy8ES3KFJkPYTuI3ALYkS2Hux+yAyI1IidygY+UvoUkAYVvdfM+fPxJp/y/ddz/v5fxn0F3H+a/c+fXxKr/P813P+/l/GdV5cW4cawUA0ecAAABINQAZFsUBU7lAaAc8hohQIXsOQQThCCtEZReAXtyQIAMdgBG4+RSVbgWdoMKnddy3asWLmJxNypUWrFql1V3KuySW7FdymxQ663FC5bNhXw1fBlmWdZ1hOrWtMteCy6xUruRYLE0frl18q/wCynzUw4ZJnDqsZl2k+Hz4Xbfh+6S2sdmeGdOrM+VGLx9dypVu3s/JTT+1XldMr1O1nC2JRSqKUlwtoLEMyejhFuwixLEEUWwid0N5KAJ3KY+/JRZ9B23KRqSIfIpJjYPgqj4C4HKKBH6knfcr2HLkBPoJEQH2CD3RhcbVDa5RnPqY1NKPcK1IfFz1Phs/60aKyimpVXcowGJdyldnW7dSOjMvd+p2I+IXm9OfeMPWeIs3/AKfDYa1hrNuHKpbs0+ZL7Udd0jWvDz25AAVwIeeEHyRpN7oDkvwu5Be1H4memtixS39BmVrGVJelu7TL/SfQXbfmTcRuaTfhj5XYz7xhZXZv0+enB5JjL6lcVKq00bsbS8qiZ7mduXorwzZOCwSJUHLpV6hb7kiCyFG4EpsRLEp7AIKTv7B8ECNw3AT2G0gR1FRSbgJ3KCPZbFFI+CkT3IDJE+xkY7lGRx14hdP4fUnRXW2ExNCro/UjFXUn+2os11L9KORG4PydVZWs803m2XNeZYzB3sO16+eh0/xhHzZZPcdzLbHKdFKtte6P7D2DqNpujRnUbV2n6Uqf1NzjEYfy+ipqg9f9Tb0eeeQe5fsEx2DlO5jdVNWHxCamn6Gv/qsyf3kqtu5TVRH5y8v3hW9DwD64o134W9E4miIwOGpy5x62qKV/GdiE5Oi/wj9UYbEeHDFafVzzY3L83xVyuid1RVVSqfwZ3nTgxemF5Q4C3HJFE9uSkgbyVDuJgT7DnkKpN5HYAIKSdihEiB3G8iYCncbSHsIlAJJ8i/gSYAsSEvUpN2AYjcNwG2BTFd0WQl3CHB1C+Kn/ALDbUn9cMB/hFJ29mDqH8VL/AGG2pP6vwH+EUiBpgsqLdPyPJPsYWvzKPXyoza9DZ5gdvcRJI9wip7gD5hUJE01c/mv8DIxe1NXyf4BG1X4M/wDrEar/AK+f91SbA2a+/gzz/KH1bO0Z5/3VJsF2Mp5emOBTBOVuXgPgjpJLtPJIEAWWOw4QkAuA37BOSgSICcidwghx7id0FyxG8hSYD9Q1JQj+TMsuw+b4DEYLGWKMThMRbqtXrVammuipNVJ/NNmnDx5+CLH+H/PMVrfSeGuY/p9j7rrxNmhTVll2qrvwvI3UlTEvZybmeD87PciwGpcoxeWZnhbeNwGKt1Wr1i7TNNdLUNfpLE4JjL5tqLlNymmuitVUVKU13M000zuh4yfh4Z30gznH6q6eYC/m2isRXVeuZbYo81zLu7VKX7BbJNuTpXYxNnE2/pLVaqpmHHZ+jNInLzzGHk7hb8FX1lK3IkVyhRAgAg2AAJz7FRGpChQEggBDgABAQAICB5W94CiLVsm4Ma66bVDqqqVNK5b7HYLwk+DbVPik1Bbxddm/lGgcLcX5Vm9VMLEtPe1ab2b4n2qJM4WImeGPg68I2c+KjXFFV13Mt0Jll1V5jmERViYe9m04f1t091ETubv9J6WyzRencBkmT4O3gctwNpWbFi2oVNK//hn5nTLpjp/pLpHAac03gLWAy3B21bot26YmO79We1xBnM5bxGFSgRAQZHSNF5ElCBFyG4HYKNSjpV8XFf6EO6v/AL/gPxrO6vHc6V/Fy28It30/V/AfjWEnhp5tf0m3+9X4GRja/pdH71GZs8wFwABOCkKBOeDOj86n5oxj2MqZVVPzQRsv+D2pyfW//Hv+ENk3JrZ+D24yjW//ABz/AIQ2TPYynl6Y4SN/QvAljsR0IQJHPsABQBID2G8h+gB8BSOEUCP2DaE7iAC35C5JESVIIcP2DfsOdhukFJa5C4DHYBO49QnDgAYVdvmfPr4lt+vuvP6tp/jPoLqfHzPnz8Su/X3Xkf79X8Z1XlxbhxqCpA0YBCgAGByBGC8E5CE7l5JyFwFUAQRBAhYa5KoOAk4AQEpDdiPYAE9yTG4rrpt0OuqpUULmqrhAJ34JXV5KrdKpqquXKvJbtpS66vRHvXR7olrjr3m/5BofIb+bWqGqcRmHkbw2HlwnVUuN5+42i+FH4bGmOjWIw+pNZ10ar1aqKXQrtKdjB3O7txE8tfWRzMtIrnl1y8D3w6sf1AzTAa76qYCvB6dw9VN7L8gvLfF1dqrq3TohvhpykbYcHg7OAw1nD4e1TZsWqVRRboUKlLhIytWqLFqm3RSrdFKimmlQl9h5N4M20RhScv2JyFPYKq59h35G8hqQG6Y3fAYnYBASgTsEAZNyzBQIl3kSIkQAS3KQMCk7+w4+QkIpBuCKTtweK7VTRT5qmkqd232PL69jjXxH6tu6D6E661HYf69lmVX8TTHrTTJRoY6q6jxOq+rWuM0xTmu7mt+1S/a3cqoX6EesyFjq8zd/G3J+kxeIvYir511ur+MiRrHDzT5kLBDJQiuU9CVPZ8yVkpU3aE+7gDvT8I/RVWP6z6s1TTb81OX4X8j+k9PpKE4/vTbbS4pXqa6Pg0ZHiML0/wCouaYi26aMfmWGdmtrlUUXKXH2mxj7DKeXpjhUJAI6GHwOQAQ7yJ9EO/sQH+gLdFBRj+JYQgMB3KSYD2ApFITKERjtsIkcBQTIQa9AHLMLn1VP6DOdzGunYDQp419B3dB+KvXtm95l+qV55nQqvS7XU/4jhVREndj4s+hsXlviAyTVdVNVOBzTA28DS4hOq3TVU/8ArHSdI0qwvysyGx2Ce50zR/MyT8rTnhmPIeyA79fB2zyrA9S+pGT4nEt272Bwt/D2m9nVVcuOqF8kja3S/wADR38ObUV/T/i705TVeVnBZpYuWLrqqhPyUVOlfezeHQ1ELtsZTy9FZ8M+w3JuzIjtJSDCHG4CURbljcJQA/AclIAmPkOeQ0pIuQi9xAShlAEgkw2PcKyJAe4mEEUk7CfvE7hQRv7hyO/uERoNl24C9AqLdHUT4qO/g21J/XDAf4RSdvITR1q+IV02z/qt4Yc807pnBfqhm1/GYO5bw/mjzKi9TVVv8kBo6tqLdHyRnJzsvAr1yppS/kLtNR/vz/yL/MMdcv8A9F2v+ef+RrmHn7ZcD9yyc8/zCvXNf/Bdr/nn/kT+YV65pf8AqXaj+rP/ACJmDtlwP3Bzx/ML9c//ANF2v+ef+Q/mF+uX/wCi7X/PP/IZg7ZcDpjyvy1fvX+Bzv8AzDHXNR/6FWv+ef8AkV+BXrlNS/kLtPb/AH5/5DMHbLu18Glf5xGrXPOef91SbBI4OmnwwujGreifSTUmU6vyxZXjMTmv09q2rnnmj6NKePU7l88HEt44VL1DhoiaSCRyqsbMKe5SgTuI3HACO3YccBvYoEW4bgfIdwJ3L2CRQiT6jljZhbBSNyRJfwDQHixOEs4uxXavW6L1qpRVRcpVVLXumdHfFd8M3TXVZZrqbQVVOmtYXfNiPya2lThcXdfaqdraj9rT2O864C7hHzq9T+kGtuh+dX8t1vkV/KnbvfQ28bTS3hb7iZpraU/d2Z6mmqqPPR9e3+3XB9G+stA6e6gZVdy7UGUYPNcNcpdMYqxRcdPvS6k4fujov1g+EbpDPb9zMNAZ7i9MX6aa6/yK/OJt3q25SmqpKlfYdxb3ZzT2ar18+Sv9Jzn1W8DvWzo9bpxGaaU/VrCV3aqbd7Jrn5VcdM7N27abWxwdm2HxOQY38jzfAY7KMV3tZhhq7FS+ypI6zDOYlgIJTXRXvRetXP3labM1RU5+rUvsCYYjsVpox86XeCihGKqT7l83om/kEVhGXkrqX5lX3GFx02knXVTQv3bgirsVcHgrxuHt3FR9Ir1dTimix+uVVP5I5F0D0A6l9T84w2A07ojNLn5RHkxOYYa5hbD9/pKqYGVxL0JLzNpduT+jI8tzHVecWsoyDAYjOs1vJ/R4TBW3cqceqR326NfCS1FnqsY3qfntGT0W71NVeUZY6bv0tud19LTUnTt7dzYB0W8L/TroLlNGB0np+xYqpqdSxeKpV7ES+f1ypeaPaSdzuKe7oX4U/hcZlm+NwGqOr9dNjC0UU4jD5Bha/Mq290rr+rVS1ttvvKNm2m9L5XpDJsPleT4Gxl2BsUqmixh6FRStonbl+5+pTTDZkZ5y1iIhinBVuyNDn5hVkSgu4dIDkSRLsWNgDW4D9h2IB0q+Lj/sRL39fsB+NZ3U3Z1Y+JH0t1J1h8NlzT2lcB+qWa1ZxhMQrHm8s0UOrzOftRUlpMsqLVv96vwM0/Q55p8CnXNU0paMsuKV/wC2f+Q/mFOukT/IXZ/55/5GuYYdsuB+4OeP5hTrrP8A6l2f+ef+QfgU66f/AKLs/wDPP/ImYO2XAze5W9jnZeBfrp/+i7X24z/yK/At1zf/AMFWv+ef/wBJcwdsuBzOhb0fNHO38wn10e/8hdn/AJ5/5Hko8CfXPzU/+hVmef8ATv8A5DMHbLtr8HvfJ9b/APHv+ENk3sdEvhldENc9G8DqyzrDJaMpWKueay1e87qfnlrjiO53tiWZy2jg5knDLJFSR0rW3oEvccISEJ3KRhBVI0vvJO5Z3ANbEgvMkfMAWII92ZGKhgXlQNw9kO0sA1IYQmfkAmCkckXqBYDcDflDlAeOvdr5nz6+JP8A1+9ef1av4z6Cq09tuGaXut/gy6yaq6v6vzXLdJW7+ExeK+kt11Yryp07xGxYlxaPDqZG+xTnf+YX65z/AOpVr/nn/kH4F+ua50Va/wCef/0neYZdsuBywc7/AMwv1zl/+hVr/nn/APSX+YW65/8A6Ltb/wDDP/IZg7ZcDsHPD8CnXNpv+Qu1/wA8/wDIn8wt10X/AMF2v+ef+RcwdsuB47hHPH8wt10p/wDgu1/zz/yKvAr1zf8A8F2f+ef+QzB2y4Ggsb7nO38wt1zTf/oXa/55/wCRlT4FOulX/wAF2f8Ann/kTMHbLgdg57p8CPXWpx/IZYXzxq/8D+jD+APrzirlNFOj8JS3+3x6S/AZg7ZdfBG52gwvwz/EPi7fno03ktCfCrzi2n+lH9eF+F54iLt+mm9l2R4a039apZnaraGYOyXVSY7lpt1Vvalv5I7zZJ8JjqTi6aVmepMDgW/zvordu5H98e9Zf8Gm3drs3My6nYiuiZuWLOXqmfbzKsdy9ktbl+tYfe5UrS/d7GGGxdrE4u1h7LeLxF6ry0WcKvPVU/SDcJpb4TnRbLrFCzmzmmdYimP1x425aTf72Wdj9FeHjp1oDLrGDynR+UU02Y8l2/g7V26o7+d0yTuXsaVumngy60dXMZVh8n0fcyiz5fPTjc9dWFoqX7l+VpnevoZ8JrSWQVYXNeo+Z39T5h5F9JldP63h7dcdq6GnVD9UbArdimzbpot0026KVFNNChJfI8lK+Rzl3FYh+DpDQuQ6DyuxluQZVhMrwti1Tapow1mmlumlQvM0pfzZ++kPcckdEB+hO7K+AolAlIFAnO4kJbBIIMPYRBG5CrMocBKBO4CfuHJOHuWYATuHsiSmWJcgFwUEb+8CkaCYmUEEkGw+yJwwK+NzqL8T3X1/Q3hZzq1h93nd1ZVUv3NymqfwO3NT+q2jWd8YbqDcwv8AIJoiZtY5/qnXSl/udx0/xljkmcNa9qj6O3bpShKinb3gz5RXy/mRcvc1eYjYCdiMIp4r19Ya3Xee6tUus8i3g/izmt28rxKSdVV2h26Uly2HUct2fwxsgsZR4SdLYpWPocVjrl+7efeqL1flf3M7ZnG3h70bhtB9GdIZRg1Fi3l1m7xH1q6FW/0tnI74MXows+o5fsEvURuFNkykalkYF7wEoDcIN7ASFJWFuguNyAo7CIBI39yi7MpN12EQEUkidxMkUZPQJ7FhlFJ5hO4W4DeQ+CkShBGv74v+i8Vn3SDSmfYSmKMizG7dv1R+xrppoX6TVZeoVF2tLszep46tC4nqJ4YtZ5NgkvyqqxTepcTHkqVb/QjRHgr1WKwGFvVfnXLSqb9zurK/LyoJblRE4O2QWNiIsx7gfv8ATjUuO0h1K0hm2AuK1dw2Z2aaq32pruU0v9En0X4PE2sVbpu2qlXbuUqqmunhpnzW33cptVV2X5Ltuqm7Q/R0vzL8Dfj4Otb06/8ADfoHNasWsXja8qs0YupOfLd8qdSfvucWbUlzS3uEoH4CYRw1GpCjgJyUCccidtgvcNwAkSRuQuUBX6gpEtyCRDLLKY8FFhMkbl7kb3AyJwgnJQICMSmBYncd2JE7ECPUm7KnIWxQjYxdM7fgZckSAx+jW6l/eT6Pbl/eZ+Uq5Aw+iW27+8v0S9X95kHs5Awduld394+iXZv7zON5JEBGLtJd395Po0ny9vcziCvgCUKJL8ic7F9gqQpLAXcTsBSJySdi7sCkkLkRvIEX6CzuUnIFBiluXuBQTkcKAEKR3I1ukF3YRX3InwXjccBVIlAYCKTyoRuGpYVi6fN7Qemao6NaG1pXdu55pTKM0v3KXS72JwdFdcP0bR7ov0FUMDqJq74X/QrVmYXMddyjNMvxFfCy/H1WaE/3tKOFdYfB2yPMb7enNaYrKaO1OL+kv/xo2StLmJDSYymGq6v4OOp8Nbf5P1NwN70VeXVT97qPwMf8JXqThpWF1TlWLXq8KqfxqNtzp9h5FHCZcymIaiMN8J3qndhXdQZVZXdqxS/+0exYH4POsMZZ/orqNl+EqfNNOXur8Kjat5EuEkFSk+PtGTthrH018G5YPGU1ag6hV5lh53t4WzXZf3yzmPI/hOdEMFRZrx9nPMwxNDmas0rVD+dLR3XMeOwyYhxFo3wo9KtD4Czhcv0TlNz6GPJexeFt3bvz8zpk5VwGAw+XYajD4azRh7FCim3apVNNK9kj+lB8kdI1HYLZB7lSAkwyzA4D4ALljh+wWyJyAncr2QSgPgCT95eQuA3sA7lJAe7Ajckqp8ya3+wr5L3gDBW1PL+8rtL1f3mTUhqQjDyKJl/ePIm+X95lEBegVi7S9X94Vper+8z4JGzAx+jUcv7zH6LvNX3nkgsQgMKafL7/ADM4InPsXsAiV7hKAl3JwwLEcB/pD4JSgLEoBvcoRGkFxsO7HGyCiRSIP0AQkJ3EbEa3QQ2kqh/YORKQVSJyUx7gZEnYLYMCS+Sz3KTmQG74PH9Em25f3ma2ZY3IMVQvV/ePol6v7y7yVruUYfR0xy/vDtqeXv7mXbYLkDFWl6v7yfRL1f3nk2TDUhGCtKOavvJ9Ep3b+88iW4SgDBW0+7+8itJ93955CLlgT6NJcv7zH6NTMv7zykhBUppSJyp7mUbhqQJ5UuwhLhFYaAiT+wsDsOeAJPYvBQBG4CUFJM8BBcsMJ8yG9gqPZlexOUGAVRZlklmQEjYij7S7kfIRW1I5REi7gPKhG8hbbE5CifqUpPYBAew4QmAIuSuBVwIAMbCJHcCVLZr1NJXxK+omI1p4q8xym9S3Z0zYeCtVfv8Ay1/xm67G36bGGu3aqlQrdLqbbhLY+djqrrbG9R+qOsNSZhLxOOzGvef2NDdC/wCqjqvLO/D1aUwPkU0YgACIe++HzSmF6g+IDp1pbG23cweY5zZov0pT+ttw5PQ3x7nbL4X+j7Gr/FHRi8RZddGSZfXibdyNqbyrpa3+TJPDuvLczlWXW8ry7DYO3taw9qizQv3NNKS/A/sJbUU78l7mTdJEvYsIoVFIYkjAq4GzQ5Qa2AibQ9y9xACdhIakRCASG4JKRe6ANwUncNwAfYMIoEhhKCkncCkclJAH5GrssecaXzfAUqasVg71lfOqhpfifOnq3RuJ6cav1BpXGVTiclx9zBVf2MH0g3J8m3Jo6+Ib05XTvxXanvVV7aioeb0U+9dxr/snVZ8s78OuPuJUCScdjRgncsCPsJuBXS3S1S/zk6X9ptM+EB1Cw2L6Yal0RVdruZjlWPrxadb2ps1eSilL7UzVlHqdr/hldUn078TdjJFh/Pa1fh6cvd1vaiqjz3W+fYk8O6T5bp016yXhGFvhS9+DNSZPQJiZHIWwB8lBAAEjsA4XqF8ifaWQHHyKRveCgCSTdl4QDuUk7FCJz3EIbBQFPmPkEhIBdw4DZJ+8CsQOwYBfMpB3ApHAG/2gCkSGzAMdudxAiAHYSJTJH3AVPkIjQj3AraHPsIKBPYIP2Hz5AOQJj3I3IF5HYL9BQItikDfoAYWwQ77gUk7+xSc8AFBSRHBQABIkBswhAmAEh9/UpGQFI7jhDkoTPsG4HD4Df2gEJ9gUCSBAQBKCkDApGpG0lCJuEoAn7wpI3gn6DICLgbALmACKCAUiC9xKApOQKQDEbB7kXoBYHsG2gERyiw/UNSRyFVIB7BgIchrYJyUCdgmUjAL7wlAey2KBJAhSHygKR+o5QfpICIEP1E/cEoCKTkShx8gpuvcnLMiIAuQxx8hyEB3ESI3CqT7REjZAAygCSxyxBSCcBlI4KKRzIKBOQwEA7BbfMMAORwByA3Qe4e4YDtHcLbuRP1LsAfqG9g+CMB35K2FBjUpYQleoda4mIMW4TOuHie8Q9eiKMPovStxYrW+dv8nwitOXh6m48z99vfky1NWulXus/Q2Ox3HUdaNDb1zPM/KPWZ9oh2QpuKpLdP5Ga37nruh8FiMu01lmHxl6u/i6cPS7tdfLramr9LZ7DOxpGceXivWK3mtZzETz7qmUxReCuQbgMIJ7lMVzwWQpIgQUCdykkLuADKYpTyBYY3CEgN5EjuR7TsEcK+MjXtzp14bNfZ3hcQsPmGHyy48K2+bm0JfpNCFmq7VaprvObtTquVv1dTn+M2mfF919bwvTjSmjsPjKsPjczzBXr9ulx58P5K6XK9Jg1bOO3bb7jSrK8n8YA4Z0yA5+YYhzyAVPmcGzr4O2kY0VrnU+Kwjs4jF5nbt4W9Uvz7X0SmPtRrCxFddvDXa7b/XKV9VPu24/jN8ngl6d3emfhp0RkuMw1NjMaMH58S0odVTqqab+xo4s1o52ShFJL9AjhqL7w+QoGzCnJQTuA/Aj32LPIXHAFIhvBQidykjbkBRuBMBwE5AIMpIALgRuNxO8AOETgvIhyBJkyJG4TkIlSmlmr34xOg7OBxWgdcqlu/dxFWW3Wu1FNuutT9rNob4OsXxEunGH154V9Y3XhnisyyvDrF4JJb03PPQm/wC1ksThJjMNIq4Kn3PFYuu9Yt3GmnXTMRxG38R5EavOrYQj3HcqD+8/W0jqPGaO1jp7UGBvvD4jLMdbvK4topdSpq/Q2fk8v2ML1tXrNduuXTVS+P0EWOX0daI1LgtX6VyrOcvvLEYPG4am9bur9koj+I/fTOn3wweq38sXwz5TldVFVGI0u1lV2qtua2l5p3/fHcFbIxek4HC9RyTtuBVuHtBTFIKuzD9A+GFwAjYRuUiUAUxW5YD2QB7CdigCclBJgAvfkkbmRjLYDzbjuxy9zICRwT2LG4kA1CI2VLcoETbKRKAluwHATkTuGEFC2HDDWwneCKN+gTkj33MiiJBbNlJwyAt3JFzsHwWUigxyEoCUAONhwOQ/QBGw4RSTJAlwO4bgNSUO7CSkEncCxBOGVuPkJAjbLwhO4nYCeYrYb2JEbgZEeyHIfoBEyzLHsUIE55CkLlhR7IL1De4QBORTwGE5AIMpOUA3E8BKA3ACZKTtsOwROd0ZE4QkBugnIbI+wVe4fG4iB3CCkiMiL0CqR7hrgPgIP0QgU8BzIUiPcbSJ3EbgGglBSSkwD5QiJEblIInI9yLkyKItw9yPaCzsETh7Dn5lQkKCZYmQwElJGwbCERuOSdirgKPZCJCXqGESCpyUichR+ofAncoGKku8kiWVbbAG9tx22E7wR8gVMcjZFAGLLG4h/IAlsFwI3E7gGFMlJ3CKRqRMBqWFEG4EbkaAPcqD3CCAchsjchVW6ImWBAQDcET2K90RUa7hKUG+wS4KK1sRiodgHdGFVaTa7wV7I63eKfxR4PpPgLmSZG6MfqnF0OimilzTh0/2VTUx35XYx1dWmjSb3nw/R6f07c9U3Ndpta91rft85+UPN4n/ABTYHpLlV7Jsnqox+qsRS6LdmlyrH7qt9l24OpvhL0li+p/iMweeZliK8wxOVv8AVHFYm45X0qceX04aOHMdjMZmePxmbZvi68Zj79Tu4jEXKpbb9F2Xsd8Ph/dNq9NdMsVqfFUJ4jUd9Yu1U1vRb8vkj76ZPmtLVv1Hd1mfu184f33qHTtt8E/DmtGlOdfV+xNvfPMR8odrLNMc8o8yUowoUPczThs+rf5wiMeDvsZEhEjfYCpQHwJHEkVEy8oeYRBUUEmQ1uAgFBFSNoCewkSyhMBqQ+AuAhO5hX5ohGco/G1fnNnT+mc1zO/epsWsJhrl13K3CUUuN/nAGmz4mvU2z1E8UGIyii26f5E8NVl9TTcO46lXP3VHVSlH6+vNX4zqB1A1NqjMEqsVm+PrvupOdl9Vf9U/I4RrEYhhbzJ3CAZXBHuOQX5AezdKdDPqh1Z0Xo+3c8lzOMyow7l/sYb/AOyfRFkuDeXZVgsJCX5PZotbfuaUv4jTl8Lfpxhte+JLFZxjLVSo0zglirFzy/V+mVxKJ9YqZuZo2UmduW9IxDJyFsg2OTl2i3KlA7gKpJKR7AIkKRPoE5IDexSPgSUPcTtI2TD3CHIXLCDCpuWdg3HyHeADcDaQyQ+QLyAxOxA/ADknsUZH5OqMqtZ9p/Mcuu2qL1vFYe5adFxTS5pcSn7wfqrYlSlMD5y+pWh8V0z6m6t0jjqqfyvJ8wqsNUuUk0q/+0j13hrsdwvikdMcNoPxE4TP8HZq+j1RhKr+Iu+X6v0/n8qU+vlpOn3f/wATWOHntHkblDtsOEXsVwnASCJVTK9AO8fwmupn8jfWLUeksfjlZy/OMIsRhLD28+J89Khe/lTNudFXmpTPnV6PdQaukvV/RetKLVV79SMwou3KE4VVENQ/tZ9DuR5jRm2U4LG0VU1U4mzRdTpcrelP+Mzty3rOYf3PYLZCRHrwcu1I+YG0hgEoEbe4chuEFEI9CJFe3ADcncNwx24CLwNykCnYc8jkT7AJ3gIkjbkA1t7l5Qj1D4ARtuOCN7F7bgEEoEIoESgSRFiAIuZLy/cd2wt9wASJy4K5AbNE44L23CakCdzIj5H4AI9BE8hdw3HyAcIcrYNwHugiQX8RDEhVMYhmRG0AabDcCdwwETwTjYu33FCMYLCTEjeQo3uEhO45WwBtcBrgccCYgAO4gP1AjRVuFsEAe0BrcNSJmUAQ3C2QYCI3CkpNmwEBegCQCIBJclTALYJQOWO4QgPn3KT3CnKC4C35KQR7SFITkoEncNSGpHCKHADESASgbiNoEAJkkR3K1I5Ak+hVuORMAR8liOB2CAxK1G/cqE7gHMETKnIARBGpKIfcB2IywI3APeAmTj5hb8gXZyJgpAhyUnBSKkbyTjgrfYQA9+4iRBHs0UZE9xyR77AFtuXlCPQRAD5k25KpHO0AOCk42ESA7jaQ/UnoBVMgCYAcsTuUncBEsRL3JOxeQJCkPkvIiJANbEjiBCKgKTccIoEieQvQbslTArCMZ3juVVJASX3MKqhcrVCctJLnc6l+KzxgWNGYfE6S0Xcoxuo71DovY2irzW8JS9nxzVDcQ9mjDW1qaFO+8+H63S+lbrrG5rtdpXNp/SI95+T9vxSeLDBdMLNzTenblOO1TiKHS3R9ajD0tc1PiedvY19YvH43NMxxGOzLE143MMRU672IuVNup87TwvY8dVeIxOKu4zGYmvGY++3XfxV1uqu5U9929+SJNtN7erR8Tut1fdXzbxHpD/W3w58N7b4d2/1ej9rUn71vWZ9o+UP7cg07iNa6syPTGDTqxWb4mmxtxSvzpft9U2/aRyDDaZ07l+VYSyrGGwdmm1Rbp2S23/TJ0c+H90zpzzVmda1x2Hpu4bAr8lwDrp3puqpPz0t/uW1sd/KaYpidz6HpWj2aU6kx5s/iP0k9WjedRpsNOc10Y/WZ5/RaVHyM+Y9DFe5kfuP5CLjYj23Eb7FXoBFvyXhBwSZ7BBGRjMdip+oUgdtglA4ALdiYCcjefYB3ETyUj3AJpIc7j2E7hCDqX8TDqxh+nHhkz3LarldrH6kX6n4Ku22mq1VTW+P3NLO2jexqU+Lh1HxGoOq+l9FWrlF/Lcnw/wCqVxUufLeq89tp/ZBY8pPiHRCzaVmzRbTlULn9JnySlbOeSpbGjzmzD5LEDn5FRCVL6jcxCbkyjsvuFGEeYXsPgqXUrmLv27FHl5mqtJ/oZFhtl+Ep05v6c6JZnqXH4Sm3iNQYxYnD3o+tVY8qUT6TSd8KODjvw+dPF0q6L6P0nTUriyrAUWPPHO7f8ZyJwZcvTCvcRC2EbBPYB3KTdooUBNx7AOA2IDhgSWVcBqSRGwF5ExAgJ/eEInkNSNw90ASj5DkcbDnYKRHBQQIchuCkgKRvI2QYjbcCmNXEFDA6TfFX6T4jW/h6/kgy+iinEaXvvMr1xr6zs00VJpfbUjUDRcVdFNVL81NSTk+jPqLozL+oWiM503mtpXsvzPDVYe9banzUvt+g+dvU2ncXo7VGeZDjMNVhb+W4y5ZdutQ1S6m6f0Qd1n0Y3j1fwPkqexiqvMpZlJ2yJIOS9wPHdod61csebyedR5vTubt/h09Y7XVnw3ZFRcxVWMzjJKFgcwrre/0kupf3sGkz3O8HwmeqN/S/WHP9EYjE2sNlWeWnjrVupx579KpoppXvEnNmlJxLbr2Kt1uY0vZ+plGxm3Gik4QkBEDzCX6CEgDaHKI1G/YSwLAY4D9gKYvdssiO4EjYrlDuO8BESkNR8hv8itSFJ7dxBOGFPcC8sNDbknL9gKo4KY7ljcIJyUkoJyFOA1I4I5AqW4clAEaCckbkLbkCxvIATkAlAnYpG57SEGgJ9gBTHvwXuSHIVeCNx8ywR8e4F4JzugudyphBiI4ET7jtuFG4CcsnJXsEIj5BqSgKEiUUkARFTkQGoApO4TkoEZQSZAchuBG4fBAfATJyWNyigACQNwN9wEDZMSGkEE5FQ7bCJCnYLgd/YQAQaJwZBEj1ZTGorCk9gIEyQNpE7khlZUE5DEQGpYEieTIjUjj5gHyhPI+Y5IokRzMlew3kobhepGy8ASN5L3IyygJLC5LvI54II20OOxXA5KImXlMRAX3BBCN5KSQE7hhL7QwokPYLgQA4QkQIAdwUiUAUkbyH2HCAcj5BDlBFJx8g0w1IB79wv0CEN18gHMjgLcj39gqtJhbEhzsJAqUCeQpJ3YFe6CUEngvcCkXAlEl/IBxAe4b2MXU+wRW0tnyeK9ft2LdVy5XTbopUuqpwkvc/jzvO8HkGXYjH5hibWFwmHoddy9dcKlGvfxKeL7Mep7xemdIXbuX6dVTt4jH0VRXjF3VP7n5w5R5NzutPa17r8+z6joHw9vPiHcfVbaMVj71p4j/f5PefFD4yarteK0joDEv6eXbxmcUfm2lw6aOH5t9nutjppas02q7lSbru3ancu3KvzrlTcup+7clt2KbFvyUr6vP2mcKfc+L3G4vub995/CPZ/rHonQtn0DbRobWvn+9aebf7fJkFhr2NuYbA4amqvF4y7TYs00rduppP7k5I1D9TsP4Iuk93XHVCvVWMst5PkS/oeutfUuX3NNdK90mmcaGlOvqV049f9Hq6v1PT6PsNXf6k/cjx87ekO7PQfppZ6U9Msi09RRR9PhsPSsRdpX9Mud6n7nIsbkoohMyiEf0CtYpWK14h/iPX19Tda19fVnNrTMz+Mj5Kt2IbLO/sdMRyTlFYS2Aj3LwicMrAbjkk8l7AFsg1IhcBbIIJyPKO8gAignCANpMOfUEbBD+LOMyt5PleMx13+lYWzXfr+VNLb/A+e3rp1Ht9Xet2uNZYa9cuYDNMyu1YSm658lhuaUvY3F+P3q/V0g8OmoMbg8ZThs4x9H5Jg6W4dxtpVpf2NTNG2Ew7wWEs2HtVaoVNUd2dVhnefGH9HJOCJlO2QOAnJW9yoL57nOfgk6aPqn4ndH4G9g1jMoy29+W45RKppdFapn+ySOC3tv25Zsx+D50uptZDrDqNVX5qsxvPK7NFa4otumtVL+2ObT4d0jMtkVm2rNtUUqKUkl8jNFS2gJQZPQdw3BSblEb7lGzD5QFJAkdwCJEGRO25Aidw1I54BQjaAghwAAkkTyEX5gQF+kKpGSH2LHuATkpChEmCkgMKoJG5QMLi2NMXxQelC6d+I+zn9qp1YfVmGrxVVNKSpt3KXTbS+2JNz9Sk6b/FB6S3Nf8Ah0x+dYG1bWY6brWZO/UvrKzQm6qU/dtFjxLmYy03r/yMnsePD103LFu5S581Kbfv3PI9zV5x87ETMktiPcIdz2fpR1D/AJUfVfSGuHTXdpyPMbeIuWqf2duly0z1f5GF7D04u1csVvy03V5W44QWPEvpE0tndvUmncszW3Ct43DWsTSl289Cqj9J+sjqH8MrrBb6m+HLBZdfxlzGZzp648Jja7i3Xmqrdtf2lKO3cqDF6VZPcsbFCpPoG4CUMMIi3kLZmRGFGIJEoq4AJFImN59gDf3kfqWUG4CKROQ5J+xIqygYVSgmmyjyA8b5RmtwKRuGTbgvCAnPsI3LtIXLAdtxIe+wgCmPmLuIAJQwwlAa9wExAb7DkoESgTsGt5IuQLygnMhvcJQATKTuHAEkrUkUSE9+SBPbkvKDQRRFsyyBGwRTGZcCJK9wow3Aj7ikEA5E7lQTkNSAgpwxMhjv7AUiEe44bAP1CciJGykA9hyiPdSUIoJE9xMBR7Cd0FEidwC3D4DcFAi5gJyJD2IA7hBuCh3gpiuSpyEGwnIZEFULgj5KkER7dy8idyQ0BZ3Ee4e4CnsEikgINSFtyRr3LG24UkbyQq4ANTAe5JTLMNgIBSNSATkoInIRHyVbOBH2jhBRuGORPYNAE5DC5EARehV6FInIQfAngcsQFJnYJ9iMsz8gCcifQpi/uAr4HYdwwC2KRrYRsA7lJO4ckBKCkQjeQE7wJlgpUR+xIncswJhhRKAuWG2iSBeQSNuRABcF5MXtyYKqHE/eEZ1QpPUOpnU7IelOnb2c6gx1GDwtCfkpqf1rtX7Wld3ucd+IDxT6a6MYCrCW71Ga6lupqzl1ipVOhxs7kOaV6OOzNdXULqPqTqxqG5nmqMZXfu1f0nAUVfrOHp7UqIVXPLUn5O76hTb/AGaebf6P6X8MfBW665Mbncf1eh7zzb5R/N7p1+8R+oevGa3LFNy7lelLVT+gwFG1V9ftrndP2Tg4p+rRQqaNo4M6apXEfIqS2g+R1NS+rbv1JzL/AFBsNhtul6Fdts6dtI/WfnPvJOylDnsCr9L4kze/lhVRdxF2xhMNT58Xi7tOHtU/uq2qZ+yTat4cOlFvpB0tyrI3Qqcd5FfxtS38190pVufmjpj4Hukj191FxGq8xsVVZNk1Plw3nomi7ec01/2rSZsetLb5n1PStv21nWt68P8AOX0ldb+u3NOk6NvFPN/aZ9P0VPaEZcFgQfvv4knmLEoQGFUEa3ExyQHyPcNwRf8A8IovcJyPmUCdw3sUkASeIKRpIsxAFAJJAfBKtkVs/D1tqSxpDSecZ5iGvocuwd7FVU1OPN5KHVH2wVGqz4s/V56t6pZB09s00XcBkFH6o3btFTl13aXS6X22dKOiqfnlvueydS9e3OqvUjVGsq/pKP1Zx93EW7dxt/R2nVNNKnspPXE9t+TWIwwtOZIgvYvZk7FcIVL7hyX9AVPye9i7trC4dL8oxV23h7SfequpUr8Tf14VOl38qDoPo/TV3C0YTMcJgLSxyo/Z3/KlVU/uNOvgo6UWusniT0zk+Lwty/lWXVfl2Lu0ptUQptz/AGVJvlpjiNjO0tqQykpAjl2JyF8xO4QVE4QmUNkyvdgRFT4HCHIFI+AkJ22CCKRSUKnqORuGtmASgPgRwE5CE7wGpC33KRUI32LGwRRQCIA1IbgJ7jlbgNxMCdicsA3ufkat01gdZaczDI8zsq/l2YWasPftv9lRVyj9jh+xjV9ZNLkI+dbq5oDG9KuqeqdJ5hZWHu4DG112rac/rVyp10f3rR6onPJ32+LZ0fWn9f6f6i5fg6nh8zt1YTM8T+xV36lFr9CZ0I/N29zWPMPPaMSvOw9GRDgrldyNP1LH3EncDt78MLrK+m/iAv6Xx2LowmQamw9VflhfWxVHlotL7fNUbl6dkfNvkeo8XozUGUajwCpePyfF28dZdS7235o+9I+hPoz1EwPVPppp7UmAxNGLpxuDtVXq6OFe8lP0lP2VNoztDek+MPeFuThl4I16HLRZHInb3E7gGxs/mR/MKAKkIDW5QjFjdINCPvCqnJPmZEiQD/QY1SkZmLlII/A1nkWJ1Dp3F4PB4mrBYuumbV6l/m1LdfpRwV018Uzy7V97QHUu3Tkmq8Lc+hoxbp8uGxlK/wBsVW1KTcrb0OyT3Ot/jG8OdrrFpD9WMttU0amyih3sPXTtVeS/YT9rZ5df6yte/T8zHp7w+k6L/QdfW/ofUPFL+Iv60t6T/wBvvH+jsVZxdu/bV23Uq6GpVVO6a9jzqv8ASawuhvi61d0hxP6m587+f6ftP6K7Yv1P8pw1SfLqqltRO0d0bBemXV/S/VjJLWY6fzK3iKa6ZqsVVKm7Q+6dL3/QZbbeae5jEeLez2de+FuodBvnVju0p4vHE/ye8+aS+Y8dPK32M522Pe+PWdx+I4QShkU4Q3fBGF8yithKAnImOQiPdjgPkrUhRIpjLQXPuBU5CW5SNgGtw3uG5QTATsOVuOQ9kBPZDkspCAG4S7juHPYAu4naQmG9wCHcNwFu5Aje5U9ikXABMMTtsGwCkNopEoCKT8AnI3YCRMiPuDCnqJ2I5RVugJ32L3I0uxWAT2KSEJ29wEbjccocAO5JKlBI2AP1KSkrUgPwBPYq4IJxyXhlMZ+4oS2V9id9i8gNx8xMIN7AON0E5Juy8IBMMMjRXz7hDtsJ+8pIgKJQT1LG4aAiMiRHAfAQmSOdyocsKTECZ4JEtlSgCIyMUoKtgKSAihE4Qn1DQiQowuRyhAQTkoAVj5iyPcECY5EQNmyS5KEsvzHf2DCCe7E7wA+QpuH7huBICPUkSZAIiUCX9oe4j7wpvHuE+wTDmADW4XPuFwR8kCd/YSmBGwEdSXyFVaManDRx91c626Y6O5HczHPcdRTcSi3hLTVV25V2SpW8e8EtatI7rTiG+hoau61I0dCs2tPiIh7zjcxw2W4S7isVfosYe1S6q7t2pU00pcttnSjr/wCOirErGae6btV3m6rF/N71v6tCW1SoT2qneKk/RnCPW7xO6q64Zjdw9q7eyHS6mmjAWbkXLy9a6lEp+jXc4ktWqLFum3aoVuhcU0qD5jedTm+abfxHv/J/oT4Z+jym27d31mO6/MU9I/7vf8IeS/VdxeNu43F37uNx15+a7iL9brqqb9G90vYRMyTkcH4D+2REREVjxEePySnZxwXdoLdF7IrqI9Ef1dtzz5flGL1Fm+X5Ll9Du4/Mb1Fi2qd3SqmqXV8lMyeB1Kh1NtRSpbfZHbzwFdE/1TxmI6j5xhHTRQ6sPllFxRC3prqh/JNM9O20J3OrGnH/ACHz/X+r6fQun33t+Y8Vj3tPo7V9E+mGF6SdO8r09hbapuWrarxFUz57zS87n3Z7/Rx6ESeyM6eGfe1iKxFY9H+LNfW1Nzq21tWc2tMzP4ycIvYnBWVgkwi7yBAU/AbsTuTuAmOTIjJIRkRMJyUARFJwFHtuJDG0gNwlyG9gmQRuDo38VnrT/IL0WwukMFduWs31NfVFFyzU06Lduql3JjhOmpo7w3rlFqiqu5VTRRSm6qqnCS9WzRJ44Otz65+I7Psww1V+3lGTP9TMNh67vnt/SWnVbuV09vrQnsdRGZczOIcCW7FNi3Raof1bdKoT9UjJFnsOxq8ypbbkkQACLPdvZJ1P5LkxbdO/J/RluU4jUedZTkmEbWMzbG2MDbapmPpLlNDfyXmCw2d/CH6OU5VojUfUq9VV+UZ7fqy63au0Q6LdmuaaqZ9fPybE6U0j0Tob05tdKelGl9K0W7VFzLMDasXqrNKpVdxUpVVfNtHviMZ8vTEL6CdxGw2TCqSdh39igReo5WwXATAORMFI57AJlBciJJEvcCtjj5DuGQUjJJSoiqElmSJBVncJyHwRAVjlELygEbkb7lTknbcCzuO5J+wqQB8ETLAa2IDUjeYC4KUcF+M/o9Y62+HvU2QXKLlzEWLVWY4S3acVVX7VFTtr72aFqKL9t12cTbdrE4a5Vhr1urmmuh+WpP7Uz6WLtHnpiPvNFXjs6KU9EPEhnWCwWHvfqNna/VLD4itLy1Xq5uXkvk6juvsztHq4BTllbIl6lW52wTkqX2BcsfpAlSpqpqprU0tQ0/Q2ZfCH6zq9pzPumOZYqzbu5de/K8ssJfXuUV+au657xCNZ1UOlnvvh46qYzof1t0trHB3aMNRaxFODxlyuYWHu1U03G/lTJJjMO6TiX0LzKMlwfm6dzzCamyPAZtgLtN/A46zRiLF2niqipSmvsZ+l2MnoFyGEwQSN9hwy7E5ZRU5+QW/Ince6CKRuBMEbUkVYncSJC+4A3BKlKLyice5RFTGxjctqpQ90+ZM0Gm3yEdA/Gv4cP5FsxxHUTTWHbweIbqzbCW1Lpcf02n2SpSjd7nWLS2qM10Pm1nONL5hcyrMKGqnVaqat3fatLlexuMzfKsJnWAv4HH4ejE4S/Q6Ltq4pprpfZmsTxQdAcZ0M1X+WZfZqxOkcyrddu7bpcYWtv8yr57vb0Pl+pbOdOf6Ro+PfHpPu/wBE/AvxPp9Q0v8AonUsWnGK93mLR/DOfb0dg+hnjvy7ObmFyTX9pZPmdUUUZlSv6Hv1cJKlS123Z24wGa4bNMLRicJiLWKw9amm7ZqVVL+1GmC/RRfsui7bpu2qo+rVwck9JvEPrbotctUZVmNzMsioqmrJ8TU3bS/ZfRrs49X2Q23VbR9jX8/OP/K/EP0caWt3bjo9u23rSeJ/7ZbYKK20/QyVTODeiHiz0d1isW8LTiP1Fz2Pr5Xja0rnzUbRz3Obrd2m7QnS001s0+T6TT1Kate6k5h/BN5sdz07Wnb7vTml45iXljcRuTzT9hZ9zR4V4Cckn7ygPeCTsN33LGwBcDkJbDjgCLaSz7bk29CwAbgTvBSLkIkblE87Ee4Ua9C9giTuBUu5TFvf2KiBCKTvwOEA3YiPkJ3BRSRA9xOwFJtPuJbD7AJgSIQ2QDhCQoDANwOQxO4CSkfAQQSQ7hbbDtyAez4CQ9iL5hVmR35ESIIDZOC8E2koRJeAuSgTvJSNwEA4I1zuWJ7iJAnYLYsfcOQhG5Gu5ZDn7AJHoWSPYTPYKr9CT6hssz2AiqLOxH8ixKASIlyI2InDAr9CQXuJSAPcfIifsVfcQSdirgm08FRQmORA5YbgBImBtI5AbPcccCNwgCUMPmSmPDAshboJeoCCUSIlDgSRRbCNyRPcLkovDYe6DaJLAJBwi8E2AuzEytgoZPsArX3iRyPkAYI2VbICew3Qb+xlldwI9yTuWYI2vWAJ54n0PBjMdZy/DXL+IvUWLNC81Vy5UqaaV7tnG/WHxCaS6NZVVfzjH27mNqlWMvtVJ3b1S7LsvtOgHWfxT6y62XL+Fpu39N6auVOmnLbdUXLtvsrsSn9nofnbnfaW28T5t7Pt/h/4Q6h8QWi9I7NL1vPH4R7y7L9ffHFlmlLmJyPQqozrPKE6LmLdM4fD1e6cebtwzo7qLPc21lnLzfUOY3c1zRzF27U2rcuYoT4R/BhrdvDW6bdqlW6UuEZNqV3bPk9xu9Xc2+3Pj29H+muhfDXT/h/S7drXN55vP3p/lA223IXyCandbB8+h5H1Aipbj9BOQDn7Crj/AMBEOZ2PHiL9dizNm27+IqfltWaVLuVdkiSr2vpV03xfWDqJlmlsFbuV4a5WruPu0f7XYTXnU9m09jbTpfTuC0pkGByjL7KsYTCWqbNFK7qlJS/dwcI+DzoPR0k0Gswx9NNzUGcqnEYm55fzFD8tK/sWp+R2DX4H2nT9r/R9Put96eX+TPjj4i/63vvqdCf6nS8R859ZEkir0KEj9V/OFjaCTBVyI5ApJJui88BDlE52LEE+yAq8Ii7Fe/ccAJ3HAjcJz2AJyRbGROQHCESJ3gSQPYOIEmNb2j12A63ePXr5a6GdAs5xFtqvN82peW4WzTUlX+up0O4p/aymaNrCrpo/Xa6rl6tu5dqrct1vepv7Ttr8TDrha6t9elp/L8TaxuQaXt/RW7tluKr1apdafvTVS0dTUo333NawwvPoykNywTvJ0zXgfMQAI/0nbT4ZvRt9TvEVTn+Lw1rHaf0zh6q7yrpmL9yh/Rte6qpOpF+79Bbrut/mUupL1a4Ruh+Gn0Jr6P8AQHDY/M8FRhtQaguVY6/dppiq5Yrfnsp/Kms5tOGlIy7cU8cclfMhKUUzbpJWI3DUhCRO/sRFgKDtuThRyXkCT25KhCKESScj5lT9gqSVMOEADfYIk94KEHMk7lbgiXqFUITuO8ogjUQXvyUxa3Ki99ikXLG4VI39ir1D3+QXAFI3uUjAoInIbggfM6PfFQ6FXepHRvDatyzDXsTnmmLyuUWrFKc2K6qXeqfsqKWzvCnJ+VqnT2F1XpzNMmxq82FzHC3cJdTU/VuUOl/oZUw+by3eWIt03aV9W4lUl6JmTmD3Xrn0vxPRDrBqbRWJw1WHs4LE13sE7kqqvC1VNWnv7UnpMyjbLzTGFS2TIyqQ1LCJwY37SxFmu1VxXS18jNLuw36Abf8A4XfiA/ln9GXpLNMbXitR6Yq+iuKuPq4WfJYS+ylndafQ0IeD3rjd6Ade8jzu7XdeUZlXTgMfYtr6tXmfkt1VfJ1Nm+jC4q1jcPbv4e7Tds3KVVRcocqpPhoymMPRWcw8+7LwFtSER2lRY+wlQT3AbFgd+AgAEwJ4AMce4TkcBANFAVCTvwVj0AOO561rzRGU9QtL4/I84w9N7CYu27dW29MqJXueyt/cePyp+69zmaxaMS7pqX0rxqUnExOYn2lqQ6z9Hs26FazryTMqXXlmIqqry/Gv827RM+WfWlNI9IpcUuaYaNtPWTpBk3WPRuLyTN7FDqqXmw+IVP17NxJ+WpP2cOPY1a676fZz0r1ZitM59bqpxVpt4e+19W/a38tS94Uv0k+N32ynbW7q/dn9n+rPg34rr13Q/o+4nG4pHn/FHvHz93rzsUXPJcl271Dmm7Q2qqX6qDnro74yNZ9L6bGW52nqzIqakvPe/wBM2KPSlU+VP7fc4IVPl77epXW53PBpa2poW7tKcPt+pdL2XV9H6jfacXr6e8fOJbVelHiD0X1iw1FWRZvZeOVKqvYC5Ulete1SOTKKlPY0uW1ewmJoxWDxN7AYuhzRfw9boafyTU/adg+lfjf1toGuxgtTWlqrK1UlVim4xFuj9zRSkn9rPo9v1atvs68Yn3jh/Bet/RpuNCba3Sb/AFlf4Z+9+Xu2Rp+xmnscRdKvE1oTq1RatZVm9GHzGtf6nYyqm3fT7/Vls5aouJ8H7tL11K91JzD+Obna6+y1Z0dzSaWj0mMSzp2LPsY+ZJSWYXJ28y9giKqYHvIF2YbImQDJPcfMTJOQDlliB79iJ7kF5XoGRyXsUIkL9BFyXgCmLe5UyR3AsbyJfoJngNwgJPqV8egKQCDuPtKhM+xFtJUg1IU4Q53EzsSH2Asv0E+wE7wAlMPYjcPgr37BCRG24agMKNSIG7KBOIHcDeQEbhoBfMBKgpGhADZiBBQicBDn2D4AMJQFuieYKyBE5DfYA39pOFMCY7F5ARIkCCAtxvPsKQUJGwjcnHIBclgj5CewFXoGggwEIcDvAgAOQ+BwgJBZhcCNyPbuBUTdMswFvuBGHBZ5JyBkRcv1C4D2AINEQfIFSIuRJZSCDUka+0qcoTsFHuuCJCYLygHAiQvccSA+RH8x5g2BCpSYzE9vcedJJzKArMXMbngzHM8NleDu4vF3qMNhbVLruXrrimlerZ1U6zePHTul/wAoy3Rdr+SbOaX5Ffof9CUerdylvdfIw1tbT0K92pOH63TOk73rGtGhstObT8uI/GXZbVesMn0TlF7Ms8zCxluAtqa79+qKUdK+tHj0xecU4nKunWGVqw27dedX9n6ea1Daf2r0Os+u+oGq+qOaVY/VmdXsfU6nVbwtNXltWlO1P1YmNluj8K0lbimEqfRKD5nc9U1NSO3R8R7+r/Qfw/8AR1s9jMa3VJjU1I/u/wB2P5risTjMzzG/mOaY29mmZ363XcxeIc1VN87LZfYg35nNQ44WxNmj8TnzL+wREVjtrGIg5Eb9vmIn5lfIERWtwkGAkPfgnKFK+4BU3G7Ue52Z8EfQK/rbUdnX2e4N05Nl1xVZZbura/Wt1dXrDlHDnRbo/mPXPX+GyLCOqxlNitV5ni6VP0dqYaXq5jbY2s6W01gdH5Bg8nyzD0YfBYW2rduihRCXc/c6ZtPrLfXX4jj5y/j30gfE39A289K20/1t4+1P8Nfb8Zfr0UKihUpQkoUGcJETTRJPrH+ZlS9zIxW2xZgKdykie4jYA4kpJ34I3IGRGE5DUgHAUBwHtsRFIgu5Sqk9+Q3Aewb9gEdxKgnmLKZBOz2OFPF91ws9AuhmoNTfTOzmNVp4XLmon8prpf0f6Uc1N7x9hpy+Jz4g6+p3WSzozK8TOQaapdOI+iq81vEYhtVUVfOndHUeUmcQ6dYjHYjM8ZjMfjavpMdjsRcxd+t/sq7lTrf6WzBr3Dbb/SDV5uQERQiBsvZmLqpoTqr2opU1N9kFcjeHXpTjOtvXHSmksJhacZYqxFGOx1qqf9LWq6XcmP3LPoFybK8PkeV4PLsJbVrCYSxRh7NtcU0UUqmlfcka9PhJdD/1O0pnHU/NMLbrxWbXPyfLL0vz27VPmouL7WqTYwlHYymcy3rGIXsFIj7CkdseGZGMblbgIQJZTFsKcssQ+QtvkGA78BsCQgt+RwUjUgNmxwSEw3uFWfYANBCd+AhPA4kKKBw4CEAJaY59hwgnIBBKB3DATAnYjksQggnIneAoDWzCnD9ghH1QiBKFXAjcNSUa2/i3dB1icjyXqplOEpeMwNz8mza+6+bEU02op9nVUay00/zavNT2a7o+i3qhoPAdStB5zpzMsPaxWHx+GuWlRepVVKrdL8lUP0cP7D58NeaAzDpRrvP9F5o66sZkmKrwv0rtuhXaKXCrpnlNzud1ljeH4Te5U1yHEiNztkLkRuOfkTcDDEWfp7LplrvS6XDVS/Nc/M3L/DR6/rq70MwuRZniqKtRaZjBXbHn81x2KVTTRcq77vzbv0NNbW0PY5q8G3Xe/wCHrrzk+cV3qreQ5vcpwOa2qKJddG/0bnt9epOTmYy0pPnDfauAeDB4u1jcPbv2blF2xcpVVFdFSqTXs0eZRJm3HSUdw3AEfJkRblAjJBU/USAhBKCNt9i9kAbgSUi3W4DkP0EQHwEOEYlQ/AKj2OHfEd4fss656SuYatLC55hqXcwWMo2qVa3VNT7pwlucxtJow8sHF6V1KzS8ZiXr2m719jr03O3t23rOYlpo1FpvNtE6ixentQ4d4LOMI4uUVKKbimFXS+6cPg/icKDZj4mPDPlXW/JXi7CowOqMJS6sJjkvzml+ZXEeZdlL2mTWxnWSZppTP8ZkOe4KrA5xg63bvWq+Ko281D/ZL3Wx8VvNnba2zHms8P8AWvwv8T6HxFt/4dasfar/AOY+X+j+Pn5GS7bx7mM+Vw+C+ZH577jLx14dO8rtq5cwt+n82/hbjtVr7aYZzl0r8YvUHpjbsYPG1W9U5Jb+qrWIii9QuJ80Oqp/+Bwikl8jJXI/8TbT1tTRt3ac4n/no/M3/S9l1XT+q32lF4/f9eWzDpR4v9AdTbdGHWZLJszhefC5kvoG6n2p8z+tuc3271N6lVUtVUvdVU7pmlu7hqMRXTcqUXqfzb1H1blL9quTk7pl4k+o3Siqmzl2c1Z1l0p3MLmT+mra9KblbcH72j1f01q/nD+LdY+jLzOr0rV/+Nv/ABMZz+cNraf3Fg6sdKvHvo/WN+zl2oLF7TebV1K35bqddlv1+khUo7L5VneCz3C04nL8Zh8bYq3V3D3ablL+1M/e0tbT1ozp2y/jHUOlb3pV/q97pTSfnHifwl+ilMiNjx/SPsVVvu9zZ+S8iUBEdTgJhVjcMi3+ZeOQCiBMB8DlAJESxwSZANBbwXsFsASiSexWyOZAsyOeBEfIKEQUneAEtyikUhsk8hFhyI3E7BbIKm5Z7Cdg45AkQyt7EXJkBOVvwGpRGV7ASexUyLncsICgxmA94AvcLgTA44IDHI5EbFDhlJG5QIw+BJIlgH+kqUDZMoEY7bidxyBiZTAhBxIERYcDvCJvIFUwGpKR7ARc8lTkQnuIgBM7BehJ3LtyBGyyiNQV+gB7tEcMdxEcAWfQNwO/uO4QSgMMKQqSi7bMQSAE7mRjuzIDGByIhlewBfpI5HBXupAnIT23C3kRDAbsrUknf2EsAxwG43J3Aq/SWdjDzsxdbSCZ8ZeSoxn12PxNQavynSuErxWcZnhMus00uqcRepobhdk2pOq/VD4hGRZVcvZfovLb+e41TR+U3U7Vq3V6qU1Ujz6uvp6Ef1lsP2+m9G6h1e3bstGbR748R+Mu3GZ5rhMpwdzE47EWsJhramq7erVNKXu2dZOr3jv0nou5fy7TFD1Rm9EpfQz+TJ/8bTKOmnUXrPrnqzivpdSZ7epw62WCwFTsW49KlS4qPR7Vm1haaqbNui0m5aoUSfP6/VrW+zoRj5y/t3Rfoz0dLGt1XU75/grx+dvE/s916mdbdb9ZcV9JqLN7mGwfmbt5dgavoqaafSqqmPN9p6XboosJU27dNFPH1VE/P1LTSk57mUzHoj8K97ak915zL+zbTaaGx0o0NrSKUjiI8frPqNNOGISH4BM4es9guEB22Cj7iJHPYJQEGN4Hcx80/YBXxvJ/fp3Tuaazz7BZBkmHqxWZ42tUU00qVbpfNVXooTPz/osRiL9nCYSzcxGOxFat2LNul1VVVNwtl23NjnhK8NVrpBkH6s55RbxOrMwoVV6uJWGp2f0dPyc7r1PdtNrbdXxHEcvkPif4j0fh3Z/WW86tvu1+fvPyh714feiGVdD9D4XKsJT9NmFylV43GVfn3rnd+y429jlH9jAVKmS+WWfb0pXTrFaxiIf4+3O51t7rX3G4t3XtOZlklCC25C4GzO3lFu5CXqHyN5ANidkEGFHwOERIrcAOQ+walBERGnJUw2RIqq9xxwHsOUQRl5QQ3kocMBuIMblxUUuptKlKW2+EEcLeLnr5h/Dt0UzzVH0yozX6Kq1lduqlVK7ifK3TS5+TNCmLxuIzTH4rH4u5VdxmMvV4i9XVU6m6qqnVz7SduviWeIn+W/1l/kOyu95tP6Vqdq67d3z2cTidqlWo22prdPfg6htQ20aVhjefRQCNnTMK1uSd/Ur2YB8HsHTbpzj+r3ULT+isuV2m/nWKow9d23R5vordTh1v0SPX/m1TT3b7GyL4TXh4rf6qdWc6wv0dy9/QuUKurzU1WWvr1x2aqpJM4hpWMy2G9NNDYLpxoXJNOZfZosWMBhbdlq3Skqq1SlVVC9XL+09pMV69y/sjJuTHJSRKHEBCN5HcCCBG4nbYPYIqkSJQZGo7AZEYTACExG4W2xGBe4akP2DcASGXhBj5hBEexU5AU9gtvkIDCESIDkbhVIPUj5SAr4Cew4Q7SgHuCLfuZAQpPccEFABRi15kaxfizeH65YxOUdV8lwly4ra/I83VtpUUWVLpuNerrrSNnh6d1d6e5d1V6c59pXNcPRi8FmeGqtVWriml1Lemf7JJiJczD52H68r2ZUfua90JmPS7XWfaMzemmnMcjxNWGrapdKrpW6antuj8Llm2XnmMSsSRsu5AhyK6HXQ6U3S3DTpcNNbp/eCt/YBuF+GV4iH1X6PW9JZpifPqTS9unDV01ua71lQldb7y6oO6C5Pn78MfXXMPDp1myXVeFu4hZTfu04XOMLhq1S8Th5lUudo83le/ob88gzrC6iyfB5lg7tN/C4q1Tdt10OU016mUxh6KzmH6TQCD4I7R8lkKYEARuYLCkNSADYhILuGBSNhuBGxBQSBMlBkS5DQpAKGw4RU9ygeNpNbo4Q8SPhmybrjkdeItRl2qcLQ3g8woXf8Aa196qd3tK3ZzjuyPcz1NOurWaXjMS9uy3u46duK7ra37b14mP+eYaZtS6YzjRGosZkGocFXgc0wtTpfmpii7H7Kl8Nb9mz+FccSbTevnh8yLrnkP0WNopw2c4ehrBZjSvr2n6T6bmtDXvT3P+k+pruRajwtVi+m3h8R5YoxFCf51L/8AE+M3myttbZjzX3/m/wBW/C3xbt/iHS+rvimvHNff51/k/BRdg2+fQT3Pzn30CZPzqXHKCHbgmFeO9YoxNt0X6KLtD/Y1qUez6I6nax6YYmzd0vn9/B0WmqvyLE1O5hn/AGCaPXWRrf1Oqzak91ZxPyY6+ho7rTnS3FIvE+loz/8ATuX0w+Idh6aLGC17k13BXY/XM1wrmy9/9zpTf6ex2u0X1P0x1Ay+xjcjzrC421d3ppV1U1/bQ919xqI87pp8r3pfKGS38ZpbMv1RyDMMRkOP7YjAV+Spv3Z+zodV1aeNSO6P3fybq30bdO3czfYXnRtPpzE/ybo/Nv7FT3e5rX6feOPqFoumzhc/t0arwFvm7T/plr3qqcHabpt41enPUCmxZv5j/I/ml1+VYHHOa5+dKj9J+9o7/Q1vEWxPzfxzqvwZ1rpP2tTR7q+9ftfrjh2E80DzTB+fgc2wmZ2lcwuJs4mhqVXarVS/Qf2U7pb7H6HL4iYms4t4l5Zngje5inCKBlxuIJLRd/UCNbF2HGxI+0BBZ3gNDsAe+wgRuHLAKCkn2EbgOCT7F7h/KQJMdiyUxSkC9yk7h7oA0iTCLGwQCduB3kpNuAKSZ4HDkSAj2EAoRGpHcQ/URuFAmIgMgLlhsT27jsUJkdhAj3AAdxyEUk9h35ERuFE/UcBqURgVbuSKCpQIAibkrZIEwBVtsG4JLKnIEfyHHyCkqATDD4HBQJwikYTAJQH+gTuO/sBPmWQ92H2ANhOSk4AIc9h39hLAjY5W5aSKQHKEJFj3kjILw+Rt6mKa7kalz+JRk0g3J4Kqo+a7Hr+qOoenNGYC5jM4znC4CxRvV9JcTa+xbkmYrGZnDvT0761oppVm0z6RGZezVNPueO5dpt0uqqtU0r9lU4SOpXUP4gmlcnqu4TSeX4jU9/dUYmxVTTapfq1VDg6z698VXVDqJc8l3PatPYGGvybKaqrVVS/dcpn5et1Lb6XiJzPyf0LpXwD1nqcRqWp9VT3t4n9OXf8A6jeI7QPS/D+fOs+sfSufLZwz+mqb9IomPtOp/Uv4geotQKrCaFyWnJ7MumrH5jF5VKeaaV5WtjqpTl+HWKrxddP0+NrfmrxN3e5U/Vs/pqrdfLl+5+JrdU19TxT7MP7H0j6POk7DGpupnXvHv4iPy9fzf3as1Rn2vMS8RqfO8VnNbqdStXa27NLn9jS5g/Ms0K1R5KKFboWypXBmlv7DefY/ImZtOZ8/i/pulSmhWNPSrFY9qxiP2SIbkRJQRobCd9hyOAQKEggEFIkN7MpAieg43D7krUqQq87mNdz6LyJU1XK66lRbtUpuqupuEkvdmN29TZteapNuUqaaVLqfojud4Q/CfdquYXXeucFS721zLcrv0z9GuabtS4l/VqXyPTt9vfdX7KfnPs+e671za9A2k7rcz5/ux62n5fL3l+54O/C09OWrGutWWfNnOJoVWDwda2w1D3Ta33acPjg7fpdxSkux5PQ+30NGm30406P8fdW6tuetbu273U5mfT0iPaE7jsVbtiPtPQ/HOUGoQW622HIQe6DCmREhRMMpJ3AR6B7bhjheoCXyJlAk9mAndlRTFcgWCk7hgCctF9h2ANo62+O7xHYfw89EczxeFxNu3qbNbdWEyq3WvPN3ZtuldvL5vQ7F47F2cvwt3E361bsWaHcuV1cU0pS2aMPHT4havEL12zC7gcUsRpbIa6sHltdqfo78NtXYfdqpr7CxGXMzh1+pruXqrl+/UrmJv1u7euJR5625n9I94Cf3lTNXmQj2KTeQATCFVVNFLqeySlv0A9n6XdNcz6z9Scg0RlM04jNsRTZu3/o3XTYtt711RwpPoJ6a6Ey7ppobJ9NZVh6MNgsvw9Nqm3bUKY+s/tcs6I/Cf8O17T+nMx6qZ3g7tjHZ3SrWWeePK8Js3UlzPnoZsW4RlM5l6KxiBQOWRfoLEEdp9heR39igSBO4kAHIHCHbcISGpC4KBISEzsI3kLZhVMYMidyCNRwH2MiMoMdguRywE7cBqQ5D4AE44MiTuAbgNzAfYcAUj+QkOSCk4DD4KHyEMi3RkBCPdGRAC+YY8o7gJn5kqUr3L3FQGsT4snh9v2r+VdV8kwldyiynhc3t2Kdlb3q+mr+3yo1yJTumoe6Pos6maByvqhoXOtL5xh6cTl2Z4eqxdt1LlP8A80j59up3T7MukfUbUGis2popxuU4mq2vI26a6H9ZNT7NI7qxvHq9c3ggT29xHudsl7EmSzsIAxuWqbtuqiteaitQ0bTfhT+JC5qrSWK6W53foeZZBSv1Nfm3uYTZtue/nqZq0iVJ7J006mZr0Z6h5HrfJqVXjMov03q7DrdNN+hc0VR2OZjLus4l9GUwgtz0vpB1Lyzq703yLVuU3qb2CzLD03FVQ5XnW1an2qTX2HudJm9DIi9ykneADfuTaSwIiAHZ7BBhKAC9yk7lAm4UoTIneAE7hIQJ2ApGBO4ESbKkBIGFVEvjY9B6w9F9PdaNL38mzzCqrzr9ZxVC/XLFXaun3Xucgswc9jm1YvHbaMw20NfV22pXW0LTW0cTHiWpbrZ0Q1D0EzpYTNqLuNyW7X5cLmqp+o1O1NXvvHHZnoc+ZJ07pm4rVmkMo1tkuIyrOcDZx2Cv0Oiu3dpnZqHD5XPY10eILwkZ70bxeKzfT1u/nmkqm7jpt0TdwamWoX7BTy3wj5PedOtoTOppea/vD/S/wp8daPVIrs+ozFNb0txW38p/1cF+aY2LB4sPet4uwr1m5Tct1cOl7Hk78n4r+ueVbG8+wShiNwDafLDW/qyPkqQOOEVKndSeO/hbOJo8t20rseu34HkaG7gT55Ws9v3fD9rRuu9Y9OsR9JpXU+Nya0482GoqTt1L0cpuDsZoL4g2psnu2sPq3ILOZ4O3CqxOXeb6Wr3fmcSdWeDJVtfaerS3Wvo/cs+a6h8O9J6r/wDtbesz7xGJ/WGyvp94zumeuqaLVee2cmx9binBY+qLk/YoObsHm+DzCzRdw2It36KlKqt1Jpo0xX8PbxC/XLabW8r6r+9bn7Wm9baq0NeV7Tmp8flNz9rRUrif9vJ+tpdXtGI1aZ+cP5h1L6MNG/dfp+47Z9K2jP7txf0ymDyebaeUa4dF+PbqBpWzaw+e5ThNSWVCqxTuVK/H72lJHPmjPH70+z+q1YzhYvTmIqhVVY+im3aT+bqP19LqG31fEWxPzfzLqXwT1zpn2tTQ7q+9fP8Au7RKtMvmjsepaR6oaV11bVens+wGb0NTOEvKv8D2jz7+x+hExaM1nL4nU09TQt26tZrPtMYeVPcKqTGmpMqfuVmymAmYp7mXYKnmEkgyW4Cf/wC5TGJLAFJKD3GyIHbkMeUpRFwCkmQhPsSILO5Qqd/YQUxkCvgdtwtxEgJ9B3EBgJkpitpLPAQ7gcSRvgKu/rASI2XeAiQ/tKhHuOEAfYNCQwp22JG5UiLkCv2Eoncc8AVSPsDcCdgCUB7spOJCIuTIicjhBSoT94akJQAkfIcyTdbAWBwvUJyOO4B7ESK1JHsQJDf/APYdvckz7FTInsXzGLmCOuld9wMp34J51MSYVXFTS6m1C5Zx1rXr9oLQP0tOd6py7BYm3P8AQ9V9K4/ZJktatIzacPRobfW3Nu3RpNp+UZck+aH6mNV5JTEnTzV/xFNOYe1dtaXyHH5xiqNqLt+35bFXv5qauDgLXfjF6pa5uVrC4+1pPC1bOzl1Sutr389J+Zq9S22l4zmfk++6d8Add6hEXnTjTp72nH7ctj2qeoendGYCvGZ3m+Gy3D0KXXer4+46765+IHonJXew+ncPf1PfSfkv4Vp2lV7zDOguPxGLzrE1382zHF5pia23Vcv3alL/AHqcfoMKKFapilU0L0pUH5Gr1XVv4047f3f1Dpv0Z9P28xbfas6s+0fZj+bnHXfjS6n65pdnA4mzpLDS4qwE/S1U/uvNKOEMyuYnPcwuY7OsdiM6xtxzVfxVX1m/shFltbiZfofkamvq60/1lpn/AEf07YdI6f0ysV2ejWmPWI8/rynmq8qpWyTlJGTe/wCJGiJ/aY/g/Xm0zObeZVuUNkudydhwipzySV9hxuSN5IKHBJ3DAvJG+wnb1HsBUgmGEgqTuVvbcg3h92EVQzx4jELDW03RVcdT8tNund1P0RafPXiLGFsWq8TjcTV5LGFtKa7tXol3O8XhX8H70/fw2rtcWaMRmyi5hMuqU0Yfum5jf2c8np2+2vur9tOPWXznXuv7T4e206+5nNp+7X1mf/EfN+L4TfB/XXewWudeYVu6ou5fk91bWt5puV++ya3jc7vUWqaKVTSoSSSS7IW7dFFFNNKVNK2SShJeh5I9D7bQ29NvSKU/+3+Res9Z3fXd1bdbu3n0j0rHtCKnZGTUhQtynofhMUzIkFKrH3K91sEoEbBEmHzJeWSNgk1IVe4aJyZAQdwh3CHcIJj80KMINjlBFIhEdwiKcokwWdz8DXWsst6f6SzXUGbYijDYHAWK79ddyqE/LS2qV7tqEUdSfiYeJ19IemNOkshxvk1XqHzWF9A/13C2onzue1SlGnnD2Vh7VFul+ZUqPN6/M5F8QPWvH+IXq5nWtcbdvV4K/cdrLLF9JOxhk26KYXszj5qHKNIjw89pzK99ySvQvch05CFgBClnv/QPpFmHXXrFpvRuBt3fyXF4imvMMTQppsWUnUnV7N0pfacf1XKbdFVVTSVKk2rfCe6B1aU0BmPUrNMI7OZ6lSWCddMr8j+rXRUm/wB1PBzMu6xmXenSOl8BozTeW5HlmGt4TL8BYps2rNv82lL0+2T9nkx7mSUGb0CKCTIE7xwVuCmLQFkpi/QIDIjfsUjAIMJDlwAXA7goEKSJ7juA3kdtxP3BgPcdxOwXIBuIHYPcMBy/YNwEoEbgN4ESigInDEyGUKjUiRMcgBMcjgRIgBOxSTvAApNx3KBFtyGgG4II3ya5viw+Hh5tpzAdVsmw9dWMyah2Mys2LKirDtuuq7XUt5Wy3+82Nbs/F1fpTLdcaazLIM4w6xeV5jZqw+Jstwq6HyipMZfODRWq7dNdLTVSTUMsHIPiA6Q5h0J6w6g0Vj6a3aw9+q/gbztumi5Zq+vFNXFXl8yW3oegdoNYl5pjHhiVcB8hMqE7QSqlVUtPdPlFZGnAHeH4XniYq6da9u9MM9vUrIs7qV3LcRduvzWr6apps00vaKnW3z24NuicHzU2MVi8BirGNwN6vDZhhLivYbEW6nTVbuL81prdG8rwOeJXDeIzo9hMXeX0Gf5VTRg8ww9VXmadK8tNc9/MqWzO0Yb0tl2OkpjtCL39jloNOR35EPsAKROR3KBOBIciYYFJs2E5AQjYnl9y7x7he5FUi+8pCgyNmRPUAn2DpmQuCNgHSkj+fFYS1jLNyzet0XbVxOmqitJqpekM/pU9zFqF7kPwdIfEf4IqvynHaq6d0/R4m9U7uJyetxbrfLdD3huXskdN3Rew+Lv4PGYa7gcwsVeW9hMRQ6Llt+6e5ukqU0s4J8QPhT051owNzGWbdOT6ktp1WMfh6fL5q/8A6lNMefvz6n4O86ZGpnU0fE+3u/tPwt9IGpsors+qz3aceIvzav4+8fu1oQ03JVuewdQenepOkueV5VqrAXMPWqvLbx1tOqxd9/PHlT9pPwPLERunw0fL2iaTNbRiYf6J0dfS3OnXW0bd1bcTHqnHyBXsTsRuMIBhDaSzEGO5ZYUgeaFBONyt7+oGVNTp7mN2m3dX1qKLn76lMktbcj0j9IxnlImazmHjw+GeCuq7g8Xi8BdTnzYbEV0L7k0jkzSHiT6o6FsW7OW6neNw1Dn8mxlih+b2dblnG725Km5juaU1NTT+5aY/B4d1sNnvoxutGt/+6Ha7SfxFNQYK5Ztap0nhqsOtrmJwF+u7X8/KqUjnLSPji6W6ru0Wq83xGTXWt1mlhYelP5uo1vw3O8LjZnjuWLV7a7YtXV389Cqf3s/R0+p7jT8TMT+L4Le/R50PeZtp1tpzP8M+P0luG051D03q+2q8kzzA5p74W/TX+DPYaa3Hf5mlfCUYjLq/pMvzLMcsqnjBYy5ZX3UtHJGkPEb1U0HRTbyvVX5RYp/2vMLKxFT9vNW2fpafWKf/ANKTD4Le/RbuaRNtnua3+U+J/VthVW/Jkn7mvnTHxENW5TYpt6g0rYzeqYqxFjEU2v71UnK+mviJ9PMerdrOMNmeU4utw6FhLlyhf2UJH6NOobbUnEX8vh978E9f2NZvqbaZrHrHn/f9na/zfWEnHulevWg9XYOnEYPU+W2lUtreKxVu1X91VUnueBzrA5nSq8JjcNi6H+ysXqa0/uZ7q3rb7svj9Tba+j/aUmPxiX6DmOSSTzSi+ZPhpv0OnmZT94kxb9SqpcgUQTze4n1CnOw3XIkszwwhIiCeZJjzIKF5EqCJgVhBP1YT3CEoJQJTI+IIqvgmzHA/iKLG47hOSNgVh8h+hOOAEchqStkn5AJ25LP3jsTtuwEyWVBi2pKtgL29Sb/ISmJ+QQS+4ckmHuV1bgI7SGhU/dBNRyFPtC2bkNp8NEmO6QRe8oPsYutTCaI7q77L3AzWw2TPx8w1bkuUJ/l2cZfg45/KMVRbj72cca58VPTfQM/qhqKzimlMZc6cT/1GzO2pSv3pe7R2W63ExGlpWtn2iXL3m+8iuJuG9zp9qX4jukbLa05kmZZw+zxFmvDp/a6WcT6t8fvUbPan+oGUYLTlrh1XnRiX896UeDU6ltdPx3Zn5Pstn8CfEG9iLV2/bWfW04/3/ZsXrr8qbmEvU9M1N1i0bpJ3KM11NlmAuUL61F3E001J/Js1c6r6ydQte3vpc61djXPNGX1VYRL+0aPTbmDV+7VcxN/E465U968biKr7f9s2eC/WI/uU/V9xtPosvMRO93UR7xWPP6timq/H102yCm/ZwF3MM6xtKf0f5LhXXZqf79M4K1V8QrXOd0XLOQ6ZwOU23+Zir2IqdxL18lVEHWi1botUxRbotpftKUvwDfme7bPy79S3Op4zj8H3+x+AOhbKYtOnbUmP458fpH/l7lrPrT1B6i0qnP8AVWIuW1v9DhaFYS/sqIbPSFhLLq8936XEXHzXiLtV1v8Atmzy1L7jGl7pH59rWv5vMz+L7jb7Xb7SvbtdOtI/wxhntSmqUqafSlQYuGy7wRnOMPXnM+RJJr2L5diNhtgWIQkMdih3GyI+WAixsO2wakJckEkPcr+RJaKp3LBFyVsgkB8yFxJYKJCE7hrcuz4girCbW7k/oynJ8y1Rm9nJ8kwV7Mc0vNK3Zs0N+We9UcLnc/R0JoHUHVPUdvIdL4N4nGV1JXsVUv1qxT3bq4nnY2SeH3w25B0KyemmzSsyz29SvyrMr1M1V1d/LM+ReyZ+htNlfdWzxX3fCfE3xZtfh3T7Pv68x4r7fOfl8nqPhi8I2W9KMJaz/USpzTVuJtp3PPSqreF/c0dnwn5oT3Z2UooSSSURwEmlwZUH2elpU0adlIxD/KXUepbrqu4tut3ebWn9vlHtC+VIvG5QavzGOyLvsGgvcKBj5CewEfG5YcDvsEoAc7AfISAEMFAjUhqSgCBlJ8whwHsgHwFOUBE8kmAK+HHJq8+Kb4ov1UxlnpBpzHzaSpxOd3bCTpalO3Qq+zVVDTXud2/Fj4hst8OHSDNdTYq9Qswrp/JcBYlOuq/WnTRUqOakqnS3tHqaHM8z3MtV5/mefZxiHis1zS/XisRcf7aqp1OlLsk24R1WMs7ziH8VNum2opXlS2VPoilb2TZG9zRiAAIOCN7F+Z4712m1RVcqaVNKmW/0BYe/dCOk2P639XNO6Oy5NvE4im5irkfVotU/W3faYaPoH0tpnLtHaewGS5TYWFy3AWabGHs08UULhHRb4U/h0WjtC4zqXnGFVOc6ipVGGouU+b6PDJ+a3XS3w35mtjv/AEqEZzOW9Ywc9xwUnrJy7UkbhOUO4BCPcbhOQHBSPgJkDngpJSCclBuBLDKBBGzAgCLZMqWwQkAlAXoG4HcCgE3n2ANSRtMrCQBcD3C9w9kBSMCQhMDuJ3EhR8BLuE5HKAT2A7QmRbSBZ3DXcT7Ee8AWQwxEkEa2K92GtgpKhMGNW/uZRIiArpV8TDwy2urXSx6yyfCV16s0ynepqtva5hUnXdpdP7Kp+WmPwNPlm8rttVJNNtqqlqHTUuU17M+lLF4S1jcPdsX7dN6zdpdFdutSqk+UzRz47fDdV4cusl+vAWr/APIrqGuvF4O7c+tTRdb81ymey81cJHdZ9GV49XXVqeApCmfch2xJgskHYB3OYPCd4gsb4besuWah/KLy09jK1hc0w1Nb+j8lTVP0roXLoplrY4gRhet03aXS/wA1qKl7DGVicS+kTTOpMu1fkOAznKsTTisux1ijEWLtH7KipJr5OGtj9VcGsX4W/irvWr1fSPVOPpr+jVV/JsRfqiqqnd1W3U+VSvKkjZyn9VGU+HpicrMsNSJ3BFOEGwUInYcoTuR7sirxwEJ3I+SorUbjlDZhAHwSfuK3sJCnlRI3G7ETIFa2gneCvsHwESrksEneYLO4VH6EhF4IB6zr7p5kXUnIbuUagwFrHYS4nHnpTqofrS2nD9zXv148IGoekd7E5vpum9n+lUnddqmasRhUuz71+uyNlzWxhVaVSc8NQ0eLc7TS3VcW5931nQfibf8Aw9q923tmk81nif8Af5tLFq5RfVTp8zacVUVJ01Uv0ae6M4jnubAevXgiyPXjv5zpKu3pvUDbqqVumMPiJ589NPL9/dnRDWWk8/6cZ5XlOqcqv5ZjKKnTTcrU27qnapNbJPZw33PkdztNXbT9qMx7v9PdA+KOn/EFMaFu3U9aTzHzifV+c37B8mMrlv7h5k5jg8T6+Msl8iSx39wyhvBY9CcQFMkEL23IXiO4BjljcQ5KKiMvIe5BEUkAEibXHAqi5tWlWvSrcsbEgHE5h4a8BhKlP5Pbpq5VVulKpP5n6WWZ1nuS/WyvU2dZe1uqLeOrVH9qmfyU/Va2Ewy1maeazhlraWnuK9utWLR8/LlLTnir6vaUw9NnCajwWNtU9sfhKrtb/snWclab+IRrPKnT+rul7GcetzCXaLH6HJ1jXzkeWVEuWeum83GnxeXzW6+FeibyJ+s2tImfWPEu8eQfEb0liq1TneQ4/JvV+Z31/e0HI2R+NrpLqC9TYw+orlq4+1/CXLaX21JGtemqumF5nC7SeG7hMPfb+lw1u6quVWpPZXq24rziXye4+jToetP2J1KfhOf9W3jKOr+i84tU14XU2V1qrhV4q3S/ubPYcJnmAzFf0Jj8Lif+JvU1/gzS48hy3z+e3grVitcV2qYZ7BlGqNR6bU5RqfNssaW35PiXSeuvWP4qfo+b1/orjz/R91Ef90Nx/na4c/YZJztMP5GpnLPED1UymrzWtd5hiY4pxd6qtHt+W+NXrDlNKo/VLKMfT63sNXVV9/mPVXq+hM/aiYfPa/0ZdX0v7LUpf8Jx/q2cOpBVI125T8QPX+Fur9VMiweOoT3WFoVDf3s9zwfxIlaopWL6fZpcfeq1ibSR6I6ntZ/vPw9b4A+INLjb934TDu+q0VVeY6c5f8R/TF1/0XpXNMCu7rv0Vfgj2TAfEH6aYiicRdxODfdXKW4+6k1jfbaeLw/K1fhHr2hGdTaWj9P5u0afsWdjr1hvHX0evU0urU9NpvlVWbm396fpYbxqdH8W0rer7E+9q4v+ybRuNGeLx+r8q3RupU8W29/8sucitHEWG8V/S7Ffmaswr+dNS/iP0LHiR6c4n+l6pwbn3Z39bp/xR+rCem72OdG3+WXJvBftOPKevOhK1NOpsE0v3Z5aOuehq1tqXBP/APIh9ZSfWP1ZTst1HOlb/LL375E43PRV1s0S03/JHgf+URjX1u0Ra/O1Jgl/+RF+sp7wf0Lc/wDtW/SXvj9S9kcd3ev+gbDar1NglH7s/hu+JfpxYU16pwaj0bJ9Zp/xR+ruOn7yeNG3+WXKXuQ4exHi26VYWfpNW4ZR6UVP+I/Mv+NbpBh1vqyz9lm5/inP12lH96P1b16T1C3G3v8A5Z/k50MXsjrvjfHl0iwy/W9QflH7y1Wv+yeuZh8RDp9h01hMNjMfHH0b8s/ejK2829fvXh+ho/DPWdxONPa2n8sf6u1a35I6kl2OmmJ+JLklLf5NobN8Ulw6cTaU/efi5p8R3E36Gsu0Bj7FT4d/EWql+hmU9R2sf336dPgf4htPnaWj8Zj+bvMmmlDMXVD34+RrjzD4gPUzEXq1gciy/BUzs8RaVW32VH4mYeNbrBmdHkeOyrB0vvYw9VNS/vjCeq7aOJmfyfsaX0cddvib1rX8ZbNXVC5n7DxX8fhsNR5r+ItWae7uVqn8TVHmPiL6sZnVU7muMThk+2Frro/jPXMz6i63zqjyZhrfPcZbfNFWLbTMLdY04+7SZfs6H0Xb6851d1px+uW2jHa/0xgKX+UahyuzH7fGW0/+selai8TXTjS8vHaowlSS4w7+l/6smqTE5ZZx9fnxjuY6puW8TV5zC1kuXWJ+jy7D0OZVSoUnmt1i8/cpj8X72h9Fm2if/wAjczaP8MY/1y2NZ54/ulWX2qvyLHYzMLy4oowd2iftdJx5m3xIbNdFdvJtE4rET+bevYumlfOHSdNrX60opXlXoh53U3Ln5nlt1Tc29Yj8H0m3+jnoOh96t7/jP8nYPOvHd1SzG5Ussw+WZPQ3t+UYem+4+aaONNT9eOpWsbjeZ6uv4ef2OWOvDr9FR6RxukkEkux4rbrXvH2ry+t2/wAO9H2n9jtKR+Xkx17FZtX9JmOb5pmNT5WLxlVxP7GeCnC4W3ssLZ9n5FJ5vL8hEeh5p88v3qRGlXs047Y9oWm5VQopqdKXZCqp1bcsi2TLwF+abpANFKvkfzHA3JMP3ILz7kTkskRQAiO4IhO4lyFyO5VWXuSNh+A3AfJjhhrdAIs7EWyLz7DtuFSS9ychz8wK+xAhU4hREgOSp7kXB47l6mwqqq3CXZbt/JdyScs61FDqbVNK5bZ7/wBEugmpOvWdrDZdRXl2Q2Kk8Xmt2hpeXvTQtpbhqVMSme/eHLwl5x1fxNvO9S27mU6SoqVVGHrTpu4xp/op23TW6ZsQ0ppHKtF5JhsoybBWsDgMOkqLNmnyriJ+ex+1sunTrf1mr4r7e7+Q/Fnx3p9Mi2y6baLa3E29K/zn/R6/0m6Qad6O6bsZVkWCptNUKm9iakndvP1qqiX9p71ASgy8vc+srWKxFaxiIf5q1tfV3OpbW1rd1reZmeZF6FjYkSVHTBJ7lkIi5CquCLcyImAgJQBMAJ3KABI9B39w1JGt5ILu0TeEImexZ7FEn1HDYiCyAnYRImRuwEbgRsG4CDg/lzLMcNlOAv4zF3qMNhbFDuXbtxxTRSuW2+D+qTXr8UDxYUaV08ulOm7939Ws5turMcVYuJU4fDrau1WuZrprn7BjJM4dNvHN4mcR4j+sWKpwlXl0jkVyrC4HDpz9Jdp+rcuOrhp1UStu516XM9zx2rFNi3TRbVNNNOySXPueQ1jw88zlSFBXIE9xHAjZgG/U5Y8LHQfGeInrXkembFSs5ZhrtONzHEVWXct026H51bqjZefyunf1OJHVX9Si1S7t+5Urdq3SpdVbcUpfabr/AIe/hpt9A+j2HxmPt2rup9QUU4zG4mi26albqXnt2qp3mnzNHMzhpSMzl2byHJMFprJ8HlWW4ejC4DB2qbNixbSVNFC2SSR+h8iQlwitbGbcEBIPiAE7bDcJQI3kApDKTlEEUyVxIjYLZFB8D8ApkRID27FJwgnICUmRbuR3LygDD2Q4EsCT95WYwWpgVQGOUHwA5a9BuiJFbgBOxOeSpQEtghyh5UGyewVY3CaKSN+AC5CECZARHAKAMVvJYAANDkDZbAOw7cjhCNgKCdid+QLscMeK7w/Zb4i+kOb6axadGOpoeIwF+2l56b9CdVC37OqJOZ0iOmQj5ts90/mGjtR5rp7OKHazXK8RXhr9DTUump0+bfs4Z/F3NlnxSvCtdxdNvq/pnDUV4mwqcPm+Gopiqu0klRVSly1NTcmtNVU3LdF225t1rzU/I0icsLRiSeQOOwnY6cEDZwB8gPLgsfi8mzTA5nl912cwwF6nE4e5S4dNVNSqS+1pG8zwV+J3LvEn0mwWPquu1qTAUrDZnhLtU3PpKUk7v72qqY77Gi7ucpeGHxAZx4aurGB1Nl+IqeTYi5TYzbAVVRavWm2lVV3XldTq2jg5mMu6TjxL6A5MlwfgaH1nlPUTSWVakyPFUYzKczsU4nDX7bmmuirhpnsBk3RsJ77DYd+CqjC2+RYjkj9AMiTzJN0xywLCESh3CABqUHu+SgTsN9x3HruAgdyTBZCHf2E+gYQU7wSoo+YGMlncsTwF8gPFXTJ6p1E6Y6d6pZFeyfUeWWMxwtxfV+mpl0Vdql7p7o9wa9iJLuiTEWjEx4d6WpfRvGppzi0cTHo1udcfBVqTplViM10mr2pMhS8zwkJ4iwlu/ReVdu+x11s3rd51UL6lynau3UoqpfozdTctU3KXTXSqqXympTR1668+DjSnVm1VmGWW6dO6i3q/LsJT/TX2VScqJnhdz53ddKift6H6fyf3L4e+kbU04rtusfaj+OOf/l8vwa31t/4GX6T2bqn0m1b0TzKrD6qwDtYJ1u3azWym8PdftU43+w9Xpr81uipNVU1bprufO2ralu28Yl/e9tudDeaVdfbXi9J4mP8AmY/NdwZbvtBi/wBJw9JAmCr3WxF8iopOCtQwFJ2GxHsIkgqW/uPkOOw2RVEA90CIEK+CRABOCymID9ChO+xG5ReBywmBOCNyX2IwYVNBv7gSFsuSGIE0+23qZ7JcSYrZB/W2YMf8zJTW1w4Zk7tzluTCN+A91BfxXP8AzJV5bk/SW6a/mjwvCWKlvYof2HnIc4h3N7P5XlmDr/Owdpt+xHk+W/8Ay6zPrDP64KmxiHObe/7Q/i/UXLv94WZ9k/8AxMHkWW1OPyC0/sZ+g9ycDEOZ7vl+kP4f1AytbfkNpNekj9QMsqW+BtP5pn97bT27klt8jtgibfL9IfxLIMspbjL7H3MLJcvo4wVlR2hn9sv1Ce0PguIXMx7fpD+ejAYS3usLap+w81u1bpq+rZoS+Rn7mMSxiFzb/kPJTc+jnhFqv1Pl/I8T3Kl3EeHExlk7j2TJ9I09yJ+o7+pTH/MyVVuZ4XqHtDEIdyLCzvuxy9iPd7gq/wDOD7S7P2BG/tIglBYDf2iYKHDHf1D3HAVNy/MfIkyBexHv/wCBeETgB6iY5LyR8gVsj7CNguZ5IhyxMjcIqkocgL5ASSz6oRuHz6gJL2Ii8AJJvJWPQBJJ3ZfsIA2n2LME7ipbMLHk7kqb/wDIU1NeaeEpl8HtnS7pNqjrbmn5HpbB/SYWmtW8RmlxP6Cz6/WU7/Z3LWttS0VpGZl5tzuNDZ6NtxubxSleZn/nn8nqmEw+JzXMcPlmW4W5mOaYqpUWMHYU13KnwvQ7s+HHwS2coxGE1Vr+inHZpRFeGyt0zaw75TqT38yccM5h6C+FvS3RbAUXKLKzbP6qV9NmmJpX0jfdKNvTt2Oa6aKaVEH1Oz6bXSxqa3mfb0h/nL4p+PtXqEW2fS5mml624tb5fKP3ePC2aMPZptW6Fbt0JU000rZJdjy9ti+WCxvwfuv43ydh9pXsRfICpCd4D+cCJAfLgIRAiAJxwZEgkuAK/YkevJQwKTuJHIBhhBOQEh7CQtwJJdvUkc7ACxAWwgQBO5WG4Px9V6qyzRensfnuc421l+VYC072JxN+ry0W6F3bCOL/ABV+IjLfDZ0ozHU+Krs3MxadrLsJdq/p99pummFvDhmiHU+r8419qbM9SZ/jL2PzfMr1V67dvVS6U2/LQvZJx9hyv4vPEljfE/1ZxOcee9b0zltdWHyjDXXCdEqa4W35ycc7M4W3NKx6sr2z4ZKWo5MSpuQtjpkAAAPtgSey9M+meddZdf5RovIMPcvY/M61TXcoTdOHtSlVdq9EpRFxl2d+Gx4YKus3Uxa4zvDW6tKadrVWHt3qG3iMTM0109vqVUb/ADNydK8uy4OP+hXR/JuhvTPJtJZLhLWGs4OzT9M7ScXLzU3K5e+9Uv7TkGPQzny9ERhWOwgEdCUBqQh3CBTF/pMgIuAnLCUIduAoxAHf2ICWwXA3fsOPcoj5EF/QO8AFAS5GyCABbcsNh+4CNyfMyARIHcMLZBRdw2mHuhCIAWyDkTJRO5fQKA1uAe4T2CQ+wA1sO8DcAUhSPgBBSKQ1LAb+ggbyE5ANSJ9iMs7bgBE8jjcTIQiQmRfMLkK/hz3JMFqPKMZlmYYejE4LF2qrN21cUqqmpNP9DZoo8Zfhtxfhl6tYvAWsHes6QzW7VfynEtN2qZbf0Kq7umlL33N8zZw/4ofD9lPiN6WZlpvH26KcardVzAYqqlOqzd2ah9p8qT+ZYnDmYy0Dqd5Kt/mfua30Fn3S/V+a6T1PhVhM7yq67F5UPzUXI/ZUVd17o/DSae3Bq88wbjgDsEWNzCujzJrlNbp9zL5Ao7qfDZ8XNno/qinp3qvHPD6Yza6ll1+/W3bw1580tv8ANp8qhe7NwNFym5QqqWmmpTXdHzU1JOHLprpaqorp2dLW6afY21/Df8Y9rqnpq3091Xinb1dlFtUYe7ee2NsqPrKp81S2o32RnaPVtW2XexMsbhOUEcNSNyT3MgEYGXoR+xVugqmMRwUjmAK0Uxe5dwHcd4E+oXLCGyRG4HcrUhRuAimPcCzuOQ2oCchDgbyOGUKkB8BKGwl6hGLX2oV07bF7hrkK/J1DprLdT5ddwOaYGzjcPcTpqovUKr7p4OlvW/wDVYVXs46cX3RVLrrybEOLb+VTlz7Heft8zF0ts82vttPcVxqQ+g6R17f9D1frdlqTEesek/jDS/neBx2lszqynPsDeybNKG07GKodDqjvTPK4PHHY20dTeiukOrGVXMFqHKLGIqr/APaLdKovU/K4vrfpOi/WTwTav6b04nMtLVLUWQ0TU8PVVGItLsqVvVXsfMbnpuro/a0/tR+7/Q/Qfj/p/VMaW8xo6vz+7P4S6/TuOVweKm7VbxFeGxFq7g8XRtVh8TQ6LlL/AHr3PL5oqhpr2Px39S5iJjiT2komXwCiOCvsTaRwQO5X2kBqQpJNkFsJ24CLyT2KyJgJ2KuCBcAO5Xz7EHIDvwH6DdABvAQL3QEY7+pSJ+wAQXhkW4Bl5+RHuOHAB8CZKtycAOBzGw+YAN7jkNBbSBJgFkNlEBeNiAVepIkSXjgiEhKUI+8byFOCwHyTvwAYHIgodwwOYIHoO5W/UjYFb2IIjuO/JRZW5GoEFgCSuw5bC5D24Ase5BG7IBl6kY7DcBOw4D9yAWAuZIVQA3YewjcIiLyQR7j2kqkjngpFt3CCmYMobn0MfM1Dglyv6K3VcqqVFC5dThEdREz4hZWxi7jrxNrC2bdeKxd5+W1hrNPmuVvskj3XpV0V1l1px6sadwDsYBVJXszxa+jt00zu6JUVtb7Sd/OhfhK0l0cs04u5YpzvPq4dzH4qnzJP9zS5VO88H6O22OruZzEYr7/yfCfEHxj07oMTp931mt/BHpP+KfR1r6D+B3OtaXbGda/+kyfKkqblnKqF+uXfa4nDp2O+OldIZTozJ8PlmT4GzgMHYoVFNFqhLZer7/afsqlJGcbSfWbfa6e2rikeff1f5m658Rb/AK/rd+7v9mOKx92P5/mip4Zf0jmCqOD1vmEXoJaMifMKi+8yMU4LG4DZsIkOStgJ9RLY4W4QAMpGpAJhskbBMB+kvYkRyVAIbEw4EwGEUnqN4D/SFEySiwGgEyUkDZJgeO7cptUVVVNU00qXU+yNTfxK/GJT1Czu50t0bifNkmCqdOc5hbqa+lubp2qY2qph0ufU7I/EN8Z9HRHStejdK3KL+tM2odv6WU1grbX575luGoccmnumq5cruXLt2q/fuVOu5duOaq6ny22d1jM5Z2tjwzt21RTSlxSoSK2B6nbBAXkAASUVPf5AeDE4m3hLNd24/q0bx6+xt9+Gr4Tv5U2h6tb6kwtb1ZnlKuWqb9HlqwllqPLT7VLys6ffDs8LF/rp1Nt6uzvBUfyGaev01qm/T5ljL6hqnyvmiG5e6lG52xh7eFsW7NulUW7dKopppUJJKEkcWn2bUrjzLPsWkqUP2EnDVSJyN5EAOCmKfYrQBPcpGgBQSBuAiQuWFIiQCDCKBHsvUR3KRgIkcIc7iUBQTngktuCCzIY3RHuUVFJ3KBi0gt0WJYkAwt9wyJxsBQUnMkCYDHLKUCcBbE42iSB7orb3KRlBPYJyIJUEVKCke5QqQhGxOBMPcC9hCJywluBUUkrkoQMXTKK1tuEwrol8STwd/wAtfTNXULS9qq1qzJLTqxFm3TKxthT9Tyr9lNUzvwakrd7zUKU1XLVVPelrlM+la7bpvUV0V0qqipOmql8NM0+fEd8Idno1q2rqDpTAuxpTOLrqx+Gw9H63hLznemlfm0+VL7Wd1llauXS8SFVTVSnS1Unumg1B2xEIngF7FBptH6Ol9T5vofUeXahyHFV4TN8uuq9YuU1NS12e+63Z+duXgi8N6ng98VeQeJrp1h8ZhrlOE1HgKKbOZ5Zcq+vauRypjzJpJylCmDsBMcHzy9Det2d+HnqTgNYZI7tdu1Uv1Qwdury/lVmU6qfSXC5N73RjrDp3rjoDLtVaax1GMwWKtrzqnaq1cj61NSe6hyveDKYw3rOYe+p7iNtguAttiO0iCopJAchMky9hIFfAYS2E7gTd9g09zIx4AtIYb2knO4CfvKkE5KEY7oSyiAqMs7DhCUwImWJJ5S8AII0Xv7FIMSRyZNEmCjHyS5MXb3mTyymT7NgmMuH+r3hh0T1gwVynMsuowWPc1U47ApWbvm7OqqlTUp7SdJervg7110t+lxWWUfyU5Fbp8zvWF5b1tenll1VdjZxUvMYu35k0+Ig8G42OjuPNoxPvD7Xonxf1TocxTSv36frW3mPynmPyaVaMV+uVWr1q7hL9O1VjE23auJ/vaoZ5PPxTEN9jaN1X8LWhOrNu7ezLK6cJmlc1fqhgkrd5v3qiWdLeqPgs1/06qrxeUfR6rymmav1j9bvWqf3Tqf1n8kfNbjp2to+a/aj5cv790X486V1bGnrT9Tqe1vu/lP8ANwZOyLJhXc+hv1YbEWbuCxND8tVrE23Q0/tSkz5fsfmfJ/RYnNYvWcxPr6SSwpCEtEdKoRJKGtwJH2hF59iTt7gORzyI9RvBQ7AcDlwQQv4hJDhhBpliO4kjQU7l5C42I1wA+Y9IGyLwgpxuTvuWCJ7hFI0XggFS2JwJaQX3gX5EaH6ABIL2HCDcgFMiNhLEsKcDkPeOw9Qi+xIHoO+4DgRxuJ24Hr3Acsu79iSQovzCQWyDUEEZZCUF5KJzI2RfmSCBwXYj3K+AEdiNbiOA37AEIhhEAdysdgyog7ArckE2Kh2LwFIJuh3D3foBYhElvsXsYw6uHCQFc88+xe3oY4ZXswx1vB4DDXswxlxqmmzh6HU2/dpQvtOzXR/wJam1bes5jrnE/qJlfmT/AFNsVf0RXT+/pbX6DfR0NXcTjSjPz9H4vVetbDomn9Zv9Tt/w/3p/CHW7IsmzXVucWsqyDLMRnGPu1qilWKX9HS3x5q0mqftO43RXwD27eIwOedQcY8ZiLbVyjKbD8tuhrdKtptV/cdpOm/SPS3SzK1g9OZTYwEqLl6ihK5dfrU1yz3RKPf3Pptt0umlMW1fM/s/z38QfSHvOoxO36fH1Wl7/wB6Y/H0/J+fk2nsBp/L7WBy3CWMBhbaimzh7aopX2LY/Q8vCkySIft8Rh/JJmbTNrTmZ9RLkq4SLtuEBOBP3iNytSBJjkvJQQSdykiAlBUEI9SkT3YUncSGOQEknuXgQEJY5HICnsJGyD4ARIezkNwEoAfgOWG4JIFbDiQlBJlhDzRt3OCvF14nso8M3TTE5xfdGLzvFU1WsuwCqiq5c2UvnZeZP3g9/wCsXVzT3RPQ+Y6o1Ji6cNgsLbboon696uH5aKV6twp7SaJvEL4gdR+JXqNitU53crsZfTU6cryxuaMNZl+VtcOt0tJtRMFiMpM4en601tn3UzV+aar1Ri/yzPMzu1Xr9S2ottufLRTL8tPsj8dUqngR7laNXnmcmxCgIiHco7e4EdMo9s6R9LM563dR8n0Xkdm5cxGPu00379uh1U4e1vNdbW1PEbtcnqlu1fxOIs4fC2a8Ri79atWbNCl11Nwl+k3P/D78Jf8AM9dP3nOfYa1TrbPLdNzGulJ1YehpfrPm7pNTs43JM4aVrny5/wCi3SfJOivTnJtJ5FhVh8Jl9hW3U4ddyrduqqr9k5b3fY94iQlEB7sybKnIcSSN4LwgowTdou2wDhCY5KABG+wew9wE7lI1JEgLG8hOQ90E+wCQlsJ3HmAkwWJHPOxHwkBVyycsscAAtg1JOS8AO5EpRWpEbBBdx8+weyHoFGxwwN4AoAAgmRIe+wAP5idg+QA3EyE5CEiBBQqPkJEfJV8wDcCSfMTPuBWUncSgHO/YTIn2KBEoKRB8BCH6iCblkKkbn4euNGZT1C0pmmnM8wlvHZTmVirD4nDXqfNRcofKaP3Ww+ANAXil8PWb+Gjqtj9O4zCXqMhxddV/J8wa/W71raaVHEOry7xwcR0tuZ3N9viw8N+W+JXpdjtP31ZsZvRS7uXY26v6TeSfll8+WXuaK9ZaLzzpzq/MtLajwFzLs5y647dyzcUfSUy/Lcp9qkp+00icsbR6vyJ2BeNmSdjpkssTyT7StgRrzQ2c+eDfxUZl4X+oNr6S9U9F5reppzPCy/JbfCux+5Tqffk4DmPclVFNy26akqqXs6X3QxlYnEvpB0rqjLdZZBgM5yjF28bl+Ns037N61VKdNVKa/E/Wnc0yeAHxo43oDqK1ovVeMvYrQmY3fLharlU/qferq/Y/uaqqlMzstjclluYYbNcDYxuEvUYjC36FctXaHNNdLUpoymMPTE5f1MRP2DYi5IqsR9pTFSmBU5HfkINSBScgi2IHBUIlCUiikWw2bEbyBQSQ/YB3KQTsEUncclIqRIakpOxUBP2lJwFJ29BtBHuWNvcBHpsSEizBHyBHTuY1W052j3R5NmRygjjLqr4e9EdYMNcWf5Lh72OqpdNvMKaF9PZnvTU+GdPup3gD1RpSxiMfovN1n+Dt705ZiU6sTV7U1bUmwtqTFUuTxa+z0dx9+PL6zpHxT1bosx/RdX7P8NvMY+Xt+TTHnGU5tpTMLmA1DlOKyPH0bVWcTTP6aZX6TwSqt01Hzk2/az6cac6gZfcwOf5Nhczw1fNN6j+NQzqj1O+HhgsRVex2gs3rye696ctvr+hvvh1Hz+t0rV0/OlPdD+29I+knp+7iNPqFJ0re8eYn+Tpen9qC232PcOoPRnX3Sp3q9R6bvU4C24/VLC0zYq+Tbn9B6Rh8bh8ak7N2m4n6H416205xeMfi/rG13OhvqRqbW8Xj/DOf1xw/oe/zC34D+rs9mSfLHqcvTEee31XuCJTvBZhblT5JElgD12IuCCQZJGM7AIK9mBABjkPn2C7gT3LzwRblWwBLYnfkcv2DAqIFtMDngAlI2HASnkByFsN0E9wLuiMT945ALkPgdythTYnqN0UqHf2IPkxM/MKrRHLK1sSfYiLGwj3BH2ARuOCvki2AvISJ2E+iKK0I2DYkgcQOSNl49gIt9y9yJie8FDjkRIfDG/AQ5HA4EgGOeCvZbkTj5hY88BXEocJsxqrpVMuEl3ZJ90j7U9tfMs1Ein85zwjzadyzMdZZmss05lt/PcyqUrD4SmX9sx6nZTpf4BtUas8mK1rmLyHAVJVfkODU3n7VqpR9zPRo7fV1/GnXP+n6vw+p9c6b0as23utFflGJt+nLrFa+lx2MoweAwt7MMZW0qMPh6Zqqb9+DsZ0k8D2r+oFFjHarvVaUytv62CSjFV09vrKaf/4Z3V6ZdBdGdKMBbs5DkeHw1/ypXMT5ZruNd3Le/wAjkX6PaO3sfQ7fpNa+dec/J/EOt/SXudeJ0ulU+rr/ABT5mfwj0cbdJ/D9ozo3hKLeQZTZtYzyKi7mFVC+nvx3qqXLOSYU8FVMduCpM/drStI7axiH8Z19xrbrUnV17za0+szmSPVhbLYsbFS5OmAlAj7xuPmBE/UvYNiUEEOfYLgm/cKuyEh+pO0gWdxzO4W/sIAoAAikd/cpADUlBEoCKSA5kd+QpEFBGQH7iYYakLfkooBJQEc+p+TqnVGWaNyHHZznONtZflmCtVX7+JvOKaKKVLf3Lsfo4vFWsJh6712tW7VCdVVb4pXqadfiCeM7FdcNQXdEaUx12xozLrroxlVqqKcZepq7+1LVS7cliMuZnDj/AMaHi1x3ij15cs4J12ND5Xeqt4GzVVKxNScO7Ho/KqlsnudeXSlxszx26PJTTSl5aVskuyMzWIxDCZyBtpANhynBQtyL7wKSqvy0up7JKWyo588GXhZx3if6k4e1iPpcNo3KrtN7McVaU/TNNtWlPaaYfsyZw6iMy7C/DP8AB9d1Xm1nqxq6zGWYdzkuAuUb11f7tVOzpdL2iHKNqipS7Qfm6b01lekMkwWT5Ng7WX5ZgrSs4fC2VFFuhcJH6icmczl6IjB22Jv8ixARAlyGN49yQ2FVfoHAYCAXsGvQIKbrllBO8BBPbcpFxwPVwFUETkSAlBCEE94CD32Ez2HPsH7BTsN/UKdyQwKhDaD2gSAgMpGEGEuBHqEFHzyPwBN4Ask9mUOAJwirgD2IHGwQkilbFF4KSZEAGAlBQgR7MbyO4UaCRSdgD4JSipbCJYBopJE7gE5DHyI2Af3FXBF+goFI+AmQIcnSP4h/gy/lz6Yva30nYpp1nlNt11WEoWMsreqmeXVFMJd5O7qSaMK6FXS6akqqWoaalMExl81rVy3cu2L1qvDYqzcqtX7FxRVbuUuKqWvZyjF8mw34kngrxGRYnEdVNB5a7+FuVf5s5bh6frUf/VopXP7KqriDXhZvUX7dNy3V5rdalNGsTl57RiWUFjYdthuyuR8ET3KyIDG5T9JS0+/f0NgHw8vHT/IdjML006hZh5Mtv1q3lOa4ivamp7K1W3suKUvVs6ArbY8d6wr9EN1U1Jqqmul+WqhrdNNcNMkxl1E4l9LFupV0ppzS+GjNKDWJ8PXx9XMNVgOlvUzH7W6KbGS55fql3OytXqnxCX5zbbbNnNFSaTXDUyZTGHoicsyPcnml7FSgAtnAj3EMilhVjcj2YW3JZApIESN5CCKYtQVKAJEFjcpG4CkDv7E+Ze4BiQnPyFICSkcNk2kCvgLdDn5FAjQZKmG/vAyIzHkyYDhhidpHyCEEgNhAFySpF2bI+QP5sdl+HzCxVaxNi3iLb5ou0KpfpOEupXg46ddSfyjEXMqpyrNLqcY7CJp0v1VMwc7QmXjgzvp01IxeMvftN/u9hf6za6s0n5Thrm6heAnW+lbl6/pbMbWpMDbTat42pW7seippW7Oveo8hzvRdbsamyTHZFcTjzYu06Lb902bm6qdz8jOdKZTqC3VbzLK8HjqKlD/KLFFb/Sj8bV6Ro286c9v7v6p0z6TOo7fFN/SNWsf/ABn9Wm3D3qMVaVeHrpvW/wBvQ5R5KtmvwNimv/Ah051hcv4rAWMRkWYXH5vp8LdqdCf7yVSdc9feA/qDpy5XXpnHYTUWDoUv8suU2K49EknJ+Pq9N3Gn5iuY+T+p9O+PeidQjttqfV2n0tHj9XXaZe2xXLbP0tQ6P1Po27dt5/pvMcArTh36cPVVZ+yt9j8fD43D4tfrOItVz2pq3+4/NtE18WjH4vvtHU09eM6Not/2zl5lwHHqVryKak0hSk3uyNuOU+Q7l8vuRchMwPZCRs0OWVcnCHcRuGQROEWUIJG5QTLAgQk+SAuAOxEpYDjYcFbCQE5C9gIZQW0juTuWNgA53Eeo3ggLcRKLHciKDZfmSGWAJG0lnYjkEDvuOWN/ULcosEbLyEQSGI3LGwS2KIURHcsERjMsfaTzQjJFMpPsVS2F+ktK34bXquxOOSPPCPiUYtt9jw3sdYw9Xlrv0eduFbpqmp/Ye3aT6T6519iLVrItL4y5Tc/NxGOt1WbL9/NDOqxN5xSMsNxr6O1r37i9ax85w9XdLraS39u54b+YYfD3KbVy9TTdqcK1P12/kdsOn/w88/zminEa2z1ZWk0/yLL/AC3VUp48+zR2f6b+Fjp30ypVWXZFaxWJaXmvY6b7b9YrmD9XS6XuNTzbFYfzbqf0idG2X2dvM69o9I8R+vq156E8P/UfqTcsrJ9NXsFhLu6x2Z01WrbXqnDk7O9Nfh45RhbmGxuuc3vZ3eUO5l1KSsJ+iqphncexg7WFs02rFuizbp2pot0KlL7EeammPmftaHTNDSnut9qfm/knVvpB6x1KJ0tK0aWn7V5/zcvWdHdNtN6CwFrB5FlGGy+zaXlp+joTqS/fPc9nS8pIfqVU7yfrREVjEP5tqamprWm+pabTPrPmTlmSmBA4RWaRLLPYSO4RG2WRuAog1I7+xQjHj5CNpLKZQqJjlCNw0AfA2exEkUApE7kVJXuASKRKBxwEUkbidthEhVI1I4WwlSAfYQOSdwLHcTuRqEI34AyIySmytATdyY1tU0up7U0qW2LlatW6q6mqaaVLb4SNYfxBvHz+qlOP6Y9M8yf0VdNWHznOrDhrfe3ZqXO0PzJp8oseUmcPzfiE+Pd6rvY3pf00x6/U+h1Wc5z3D17VPh2bTWzTTcvZp0mve1QrVHlp45be7b9WS1ZpsUtS6qm26q6nLqb5bfdmaZpEYeeZzIh39AwiuRjlqREAAYtxUzJcn9WT5HmGp86wOTZPh3is3x92mxhrC/ZVVOE37TAWIy9i6TdKM963dQct0bp6zXcxuLqTxFy2pdixK89f2Utv7DfH0D6Iaf6AdOMs0pp/CUWbWHoVWIvpfXxF5pKu5U/VtTHBxV4IvCDk3hn0HbxF+2sbrLNbdN7McwvKaqZXmVqj9qqfM6domNzs4qdjKZy3rHaJSVKGI3HG3Y5dqSfURsIKAbgIoRJ9RAS39hPIUS35DE9w+AKTuRPYyAAnBIngIsblJyoDhMKJyEoInLKtkAYJuysCkbhgfsQD4C3REixsAcidyNpl+YDkRuITHCCEbiNhOwkKLZE5L+yACdykiCPeALsyJOSsKQJG8orEQRuGEXeRyEOAHeB3JJewVSTuOERb8gXcpHvsI3Aj2Kh39gluBScoPcRsAQgjcMrfoAW4aDexjIF5KSJRUu4H82PwFjM8JewuKtUX8Peoqt3LddKqpqpahpp87M01+PzwZ4roPqzEa001hK72is2vVV3rVmnzLBXW5q2X5tP1qUtktjc7B+JrDSGT6701mGRZ5grePyvHWqrV6xdpVSaa537rlP1RYnDmYy+cReWpeampVUvhp7Mex2C8Zfg/zPwr61rv5fRex3T7Mr9Sy7EtuuvC8tWrj5cJfnQludfKYk1icsJjCvYuxHuiByyZi4gvYbgY10+ZUVeZ0XKKlVRcocVUVLhp9jZl8P8A8f8AVmlWXdMepOOpox6VOHynObz2vrtRdqfD2qfmqfojWexS67dy1dt11Wr1qpV27tDiqir1T7EmMu62w+lKiumulVUtVUtSmnKaPIuDXB4B/iCPO7mX9N+pWNpozP6tjK83u7U3lMKm5U+8v85tbI2OW7lNylV0VKqlqU05TRm3zlnUycNIUzJWiKMdySy8AGRJMpJb7hFSTRSNwEkFI3DUiYDUgIcDeBwiSwEiXJYgIITvA+QRAqvf5hvYJbDZAEGpJV2LELYCbINtFjbcnLAqck7lWyCTAnsWJQncj4Aq/QRuS9/YNsBtAj0I+EFyAckacGWz3CckR4mtuYMfIjz+VehiqUyxJL87McmwGcWHYx+Cw+Nsvm3iLVNyl/Y0zh/qB4P+mnUFuvF5J+p9yNqsrr/JYfyoSOcfKk+BVSvQzvp01Pv1y9213+72Nu7a6tqT8pw6J6n+HPi8FevXdKasdFlz5cJjbP0rXt56qjhfV/hU6saIt3MRi9P2cywlD/p2CxNNddS9fJTLNqTopfYVU+Wn6qPzNTpe2v5iMfg/oGw+kTrezxXVtXVj/FHn9YaWsYsZlNTt5pk2a5ZcThvE4G7RT/bOlIxoxNm5vRiLTnt51P3G4zPtFZHqi2qM3ynBZjR3pxNmmv8AE4r1n4N+l2tFN3IKcrr/AG2VunDv9CPzb9H1I/s7R+b77Z/ShtbViN5t7RPrNZjH7tZapbp2TYc8tHdPVnw5sruqp6W1Listb4WPuV30vwOKNSeBDqnpxxluMy/UlPf6OhWHH9lUeC+w3WnzTP4Ps9r8b9A3WMbntmfS0TH78OApExue46l6K9RdGUVVZxpDE21St68PdpvT9lMnpV7EXsImsTluYYVp/wC3YK5Sl9rpPFatqTi0TH5PsNDd7bc1i+hq1tE+1oeRNMJHhtY3D32vLdt0v0rqVL/SeSqqh1f0ylr9zUmcZezHtGfw8s0TktFVNUtJv7BKamI9FA4Me8T+iLZbkkqluYJ5lIhzmPdewjYvaXwT85cQVMx7gkNb7CFyRUE87FUNBruFRdykY9wi9wFCUsOKgZPmCP6rFNUb9imVb+8Nkb39zKU3HBEz84/VjElQdS4iWXy77qPmJ8KjfqJcyWqHENL984PFcxFm0m6r1pe3nRMwuJ9YmPyeRvsJXY/noxSv1OmxYxeKq4Sw2Grub/2KZ7XprprrLWFSoyfSmOxDe0319D/10jusTb7sTP5PPrbjR29Ztq6laxHvaHrn5yRXS44f3HOGm/A71Y1FepWNpwWnLDX595032v7Wo5Y0t8OWi3Uv5KtW3Myt96cuVeH/APE9tNhub8UfIbv416BtMxbcxaY/hiZ/fh00dy1bnz3bVMdncUkwtOKzW4rWWZXmeZ1twvyTBXLlE/vqU0bMdGeC/pdoy4rlGS15tXHOaVrEJ/Y0csaf0Hp7StHkybJsFllH7XC2KaF+hH6Gn0e8znUtGHxO9+lDaVrMbLQtM+k2mIj9vLWVo7wr9V9b0W72E09Zy3CVOXfxuJporS9fo6oZzlpP4cv5Ves39XaouYu04dzCYGh2PmvPTUd4fok3uiqlLaIR+np9L2+n5mM/i/n2/wDpD65vYmunaNKP8Mef1lxB0+8LHTnp1apoy/ILWNdP+25mqcVXPzrTZyrhsFZwNqmzhrNuxap2potUqilfYj+tJJbKAfp0pTTjFIw/n+63e53tvrN1qTefeZmWEfeZJGUJ7iIex28aBbwZRCEoKn2IyMXMlj0AbwFuiOWV8AJgjcwVL0J8wKg5CQakIiQ2RWpJwwq7NDgoCJ3EQ5ETyThBV4Jytw1AlpAWW+CNlj7ieoBepZInvBWAKYrkr4AcDZBiAC9RyUkSBGWEtwlAjcAkeO9eow1qu7crpt2qKXVVXW4VKXLbMrlyixbruXK6bdFCdVVdThUpcts1dfED+IHfzfE5h0w6YY92cPbqqs51ntl/nbw7VmpQ001vUm01UI8pM4PiBfEExGaYnMul3S/MaacOnVYznPcO5ld7dite8Pz01cSjXbboVuiE223Lrqc1VP1b7swsYaiwlTaUJct8v3bPJHBrEYYTbLKVHuQSQrhZ9QABeSCpwjx3btNi1VcrcUpFGVbrpSptWa8Rerflt2bVLqrrq7JJbtm2L4ePgbt9L8DY6ja5w9GI1jjbXmwOEriq3gbNS9N06n9VzCdMHE3w5PBDi9SY7B9U9fZf9DldEXMly2+vrXWntdrpfEOlqGk3JtNt2aLVNNFFKpopXlSXCS7GUz6N61x5WF8zJvsSN+CtSctBFMZ9QuQMiCIEAE5KTgSBScSO4aASimOwS9AipCNwg1IUmRzyUAT1HCJ2ZUgh7jkJsQFOCk4+Q5fsEJ3YT2D2EhTfsHuikgInAZeVsSEgqpCI+RJgqQCQ+YEBuAD4EyIgBFMW4fJZ3DUhR7iYHr2IvcIvYfMcE5YVkCMNhDncpOfYIKJQHwUjkAuBMEfGwAshMiXqXtsA4DEeoe4CJCUByHADl/IOR8ikRjyih7FKoSJ5RSSgj1Dqn0vyLq7orMdNahwdvGYDGW3Q1cpT8rfDU/YaL/Et4btQeGXqBiMizW1XdyW/W6sszN0/UvW52U+uz5g3/Pg4z8QXh+0t4i+nuN0vqbCU103KG8LjaEvpsJd7XKG+H23nksThJjL59aXBfke/9euhWqfDf1DxGlNUYap2KqnVlmaUr9bxtrb61L9VMbpbpnoEPvya8vPMYR7MvK9xDY42CIGiiAMLttXPLLdNVL81FdG1VL9U/U2TeAb4hdy9icu6Z9UcW6cTW1aynP8AEV/VudqbVxuX5m2knskka3OdjxX7NOJtuitOOVVTs6X6r3JMZdVth9LFm7Ret03KKqa6K15qaqXKa9UZt9jVZ4GviLYrSywHT/qpjq8RgafLYy3UF1y6aZim1cftNNKhcLc2k5fmGGzXB2cXhL9GIw16hXLd225VVLUpmWHoicv6VuWPUU/OShUeyJyVk+WwF3kdxJQMZ2LPfsI3foI2AT6FImJ9iBISgfMksByw+ZLG8jkCJl9ZI9mVS0UGpKQTuQRyVbrcRuIgocAMTBA3XuPmHv3HcoJiNyPnYsoCUlj0HyHYIoIJCpMjhpF/QIANwRyUPgIkSpEbblQ5CsWtkSJMnwVKAMEt3sPKm+NzLuO+wTDx1UNxDPyM70jlGpbNVrNMsw2OttQ6b9CqTR+213C5E+fEuqTOnbupOJcQZ14TulGdKuq9ofKKLtX+228NSqvvOPs2+H500zO63Z/VPK/RYK9RQv8AqnZ9fMjUnlvtdDU+9SJfu7br/Vtp/Ybm9fzl0xz74cGTV0v9RdWZth32/LL/AJ1+ilHpmYfDo1hYrdWXazy65SuFirFyt/og2A+VGLpMJ6ftbf3H72j8c/EGjGP6TM/jES1qZv4HOquVqp2MRleZx2sWKqW/vqPUMf4XOsOBbX8hGIxkP86xctUz99RtaVqmeCVW122PLPSNvPEzD93R+kzrWlGL007T7zH+7UZjeiXVDK0/yvp7mduld1dtP8Kj8PGaP1TgKW8VpPM8NHrSqvwNx1VhVcw/sMasDYq2qtUVfOlGU9H0/S8v1NP6Ut9H9ptqT+Hj+bTA8Nj7X9NyrH2vnh63+CPHXdro2qwuMl9vyW5/im595bhN5w1l/OhHiqyLLq93gcO//wAaOP8Ao8f+5+z1f+qd5+9tI/K3+zTH+Uwt8Piqfnhrn+KR4y2lDoxH24a5/wCBuTvaQyW9vcyvC1P3to/kudPdOXd6skwdX/4zmej29L/s9MfSnpY+1tJ/zNO/5ZapW6vf83uf+BPy60l+bf8A+bXP/A3Bvpnph/8AuLBf8mZ09NtNUOVkeCX/AOM5/wCj3/jj9HX/AKp7f/8Ay2/Vp6eMtpJ/R4lp+mFuf4opxVVTXkwmMrb9MJc/xTcdZ0TkdiPJlOEpXtbR/bbyPLrCijAYen5W0dx0efW/7MZ+lOI+5tP1t/s03WsDmWJ2sZNmF1+isVL8Ufq4TQescxdKwmjs0xHm9PLT+JuDpy3CrdYaz/aIyowdml/VtUU/KlHcdHp63l5L/Snucf1e1r+c5/8ADU1hfD/1YzBKrDdPcyrT4bvWl+NR7BlnhK6v5jXT9Jpl5cn/AL4dFUfdUbSqbSoey29kHQpmN/c7jo+j62l+ff6UOrT4po6cflP82ubLfAL1KzRUu/nWT5b7XMNW3+io9uyT4cWaXIWeazpuUzusDTXb+6ZO9ioS3gsHpr0zbV/u5/F+Lr/SB17W+7qxWP8ADEOpmXfDm0DYooeNznPcbcXKrxVLo+7ynv8ApzwXdKMioi5pbC5nV+3x1qm4/wADnXyr2LHoequ029JzFIfOa/xN1rdR26u7vMfi9T010t0noxJZFp7AZWlx+TWVSe0Kh0vaUl2PJHIg9URFeHz2pqX1p7tS0zPzlj5U+SqmOClSKzEo3IkVywp7BU7l35EMKQCEQN+xXMASGysksrAJiCcdvtLICGwtg/YbMA1IjYpHwBJYSkqHoAQmQ+B9gB+gkFAAkRwN+4BIeYm6ZWtwHL4DX3Dgd/YAmG/Qnf2LwBIfJRz3GzAbSJ3gQIAMPdCfUMCQWYCRHyBZ2PFfxFvDWqrlyum3bpTqqrrcKlLltnhzLMsLk+Bv4vGX6MPhbNLruXbjimlLls1S+OT4h2P17ezDQHTPG14LJPrWMxzuy4qvKYqtUP0a81LlfIsQkzjy/e+ID8QS9m+Jx/THpdmFVuzbbs5xqDDVtKrtVYtPZqGqqanumnsa67GHt4WyrVqny0L72/V+5LFmnD2qaKE0lu2+W/V+55YNIjDz2tk7ASCuQAcAJgJ9hEjZbtpJbt+wCupUUy3CW7Z3L+H/AOCe51s1Fh9c61wFVOkMvu03MJgcRR9THVcp1J807vbbdHpngl8G+aeJzVlOc5nbuYLp/l11VXsVUo/Lak/6XRs/VPeNjdVprTmW6SyPB5RlGEt4HLsJbVqzYtKKaaV2RxaW1a48v7sFg7OAwtnDWLdNuxaoVFuilQqaUoSR50oIhujhqvLgkwVINTwAfAXAS9RHuAXuBAQDuRqGV88E53AsuAnPIewhAE5KRcE9dwizuJ3Js1yWPcKNSGOwlBE4LIW7KFTcJyH7CNwI+SspH7ARPkrUj8QpYBbBehIKkBSMRvyGAQcjiAwhDKQcgRssyg0EFJ2E+wakcP2CCJEMrC4CjUhbBuB2AdybbjsP4wG/oVKBwGA3kpEoH7ICTCEzBYGwCZlBKAxwgJ7FUlI9yAxA4QkoRuUEfqAfAUkXPJY3AdwkJ3D23ARMk5UFHeQOJPEl4dNNeJHp5jNNZ/h6ab1VLqwmPppTu4W7DSrpftL2exo260dHtSeH/Xd/SeqsPXavJ1PB4upRTirSe1VL7tJqfdn0R1KThbxO+GLTXiT0LisozXD02syoodWCx9FMXLNxTG/pMfcdROHM1y0JoLfc9y6xdGtT9A9c4nS+rMI7F6ip/kmLp3t4m3+xacLeIlLhs9Nf3GnLzzGCOf4yFlMjYQMuUYljYDC5bpuUeWpeZTPyO3/gt8fma9As1w2mNa372a6DxNxUU4q5VNzLqm4TXC8ktS3MJHURQ9jG5bprpdLXmpahpkxl1WZh9H+l9W5RrTIsHnWR5hYzTKsZbV2xi8NV5rdylqU0/Q/W888GiXws+MTVvhfzmzYtXLmc6Qu1r8oy29U27NM71Ud/slLY3QdHetGk+uujMHqbSGZU4/LsRQm6KoV2zU1PkuUpvy1KVtJnMYbxOXvifqRqewUCYI6WAJEzwEHI7FIwokUgnbcA1ISKRuAikgJyGpCn2FIgAe25FyZE7+wFJO8DgNAR8hl5KBiUQO/ICNyeUsQguAIl9xew4KBEtyRuV8lAiKSIHKCJ35KxG8hhSIJuipiZANBrYi4gr4CIvcNFlMnHuFIZY4HKEAT1JBk0O2wGMbFaTHA7AR07ojRls2VpJAYNCDJsbQBj5PsZVTBWXgJhi1vJIM2iT6BWLplB0bPYpUpCJ5XHJHRPczexN2BiqWPKZcgKkb8h07mUIQERU78iNhG5Z2CsVTJXT6FjYL1AiXqWPckqZEwwD4EQJUFfAETKu/YSkRbICzJOOC7JBbgJ22BScAJfoRlbgIIdgu4jcMKRAiNxwN2BQYw0ZASPuHoHuxH3AJCKSdtwERwJ3HI4cAUEakEAQ37Cdw+ShEkl9ysNbAFyTlsvI4AR7iIQ5Q7AE5HcIIBz2EbBhkQ3R+RqrVeU6K0/j87z3H2MqynA2nfxOMxNXlt2aFzVU+yPXOsXWfSnQrRuJ1Lq3M6MBgbSat0bO5frSnyW6W15qu8GmPxZeMrVniizavAO5Vk+irNxuxl1mp01YhTtVc7rvtLR1EZSZiHvXjN8fecdfcwxWl9HXruU6GsXHRVibdTVzHRtL5Xl/OiOzR1Bot021FP5pUlQlSlCShJFSNMYYTaZIj3K3IBUSCgBAcscBwqXU2kkpbfCAlVSopbbSS5n0Ow/g08HGfeKrVNnMcXav5Z05wF9LFZoqdsZXS5dm23s4fl83EKo8fg58HWdeKvVtrE4um9lfTzBXPNjMyVP1sVVS/6VbnZpul01NNNJm7bRGh8l6daXy/T2n8Fby7KcDaps2bFtRCSSlvu4S3e5xMta19ZXReick6eaZwGn9O5bZyrKMDaVnD4WwopooXC9X9p+7EosKCe/Y4bKtiJTyWdw/UAv0ETjYspCIAoIlBQgYtlW/wAw1IUkRsO5QIt+QxEOROwES9ytSJQ7AIn2A7hKAHCEBrgAOX8hwwwAQTYaCApJkMIAwkUncA3AkNSOAHHuJ9gxyAbaJ2+ZWEgC4HAbgoERSMJoCLYvLDlkjcC8P5kW2xUOOAE7lI9kAElJMDmQC5JKksxsACclJO4ncAnIC9hG4CYEQG94G/qA3EyxxsGAmOQ3A3DAdmSIKuIImAT5ZXv8h3EgUkdwUIxhsvCDD4Cot0VbAjbA4b8THhl0x4k9DYnJc7w1NvHU0uvB4+2krtm4lNP1uYmJU7waQ+sfRbVPh+11idL6swldqqmpvB4/y/rOKty/K1Vx5oUtJuJPogW+5xN4i/DbpLxH6IxORakwk3VRU8Jjbb8t3D3P2NSqiYlKUuVsWJw4muWgOpw4HKOQOvPQPVXhr19iNK6os1XbHmnAZtRT+s4u3vDnhVQpdLco49TXY1jywmMKnDG477hchFThCYD53JIFq/N9z3/oh121h4edWUZ3pHH127VdaqxOWXKn9BeXf6r2T947HoCaJz7QMLE4b0/Cl4yNIeJzSlm7hMRbyvU9ilW8fk2Iq8tdu5/9PzQ66YjdKJcHYJbv2Pm509qLNtHZ/YzrT+Y3spzaw1VRiLFbpmO1Uco2qeDb4kWUdTbGB0l1EuW8l1dQ6bNGNaVGHxf7qfzaOy3fuZzGG8Wy75916FShnis36MRbprt103KKkqqa6HKqT4aZ5JhHLtkR9kTgqfqAgTECZkIBAfoJ3I90BZj5lIk0I3AQOEUkhEW6Kkycl/AKchSiQkyw5ATsUjgRsAbgIpF3AL1D23EIRC2AicFnaQtxG4BbhqSRvyXn7ADWxHyWZ2JwEVoJjcNhSExHoOwUsCTJkDFAVBqQnJJYF4Qe8DlEUphF23CRF7BPcKvD9iPsJnkLlgXgMnLL8wCUCAnySWEWA0Ow5Cje24XAbgj3AyJVwT5h7oDIg4Q4AcCNyNSVcAG4D3KYvZgZEZSRIQhwH2DcCewUXIgKQ/cA9ybdxMcBKeQg36lUB87Eb3Cq+fYR6B8BPsAaD4HO4S2AR94jYLgNwA4QmRzIWyAcLcpIHbfYBJI3LEBxsAiEE9kE5DAcrYJ+pFtIa2AskRZ2C4AFBjEtgWJI0VKA2AmCkb9STvsBUoQIpZkESZ+RScIIKoJweO5iKLVuu5XWqLdCdVVVThJLlt+hBm1B1+8VnjE0h4Y9LuvHYmjMNS4pOjA5RYq81yur1rSl0U87tQ2oOFPGl8RvKelNq/o/p/et51rG6nRexVCVeHwVDW1Xm/Nrb3UJyoNUmptS5zrbUWJz7UeY3s3zjEfnYi/W6vKpny0pz5Vu9juIy4m2HunXnr7rDxHaved6sxlX5NaqbweV2q39BYXvStqqt3vE7nHicsQk9nJJb7HcMJnPK8hLYAqAIAp3G7Ulgxu3KbNt11vy008thFdSVL80JercJHYzwb+C/PvFHqa3jsyt3sq6eYG6ni8dVS6K8XUt1atzDacNOqluNj2Pwa+BLO/ELmuGz/VGHvZVoSzUqnTVNu9i9+EuUnFW8G5DSWj8o0Np3BZJkeBtZfluEtq3asWaVSkkkpcd3G77nEy1rX1l4NEaHyXp3pnL8gyDAWcuyvBWqbNqzZoVOySU1Qt6nG7e7Z7A1IShQEoOGymL33MiMCdtxO8l42DfYCmMMsw/YICgjUlIJHdBv7xvJFyUXcmz3K36CJAdhwikmSB/GIjgoKJA7lJ+AFI+BM8FAxhwVTImRMcgOQlAewmUAakQFwUAYvbkq5YfACUF6EW5YAkMsbkbKvcBIZPUvEAJgSNpDABbh+iHuAfAXAnYLgBG5SPkNe4CIQXsIH6AD23D24KRsgPdEmCzt6kUrsVGROPkG4KBjEhctl4C9QqNlQjkIgCNhIe4CSkjf2KUTsOw9hO/AEWxkSI3AQgDsPmFPwKRrYi4As8juESSCxvJG5Rdye7KOM+vvQPSviI0JiNNaowNOItxVVhcUkvpcLca/PoqacPZJx2NJfiI8M2rvDNq27lOf2a8blNdb/I85tUP6K9RvDe7ae3eD6ANuD1Dqj0q051h0jjNOaoy+1mOXYih0ui6p8rfde5YnDiY7ofOunx/EU7E+MPwYaj8LWpHmGEpuZz0+xtx/kmYUpurBPtau8b7VOaVERuddlDSqTmlrZruaROWMxgbkMszxyIUlcoisNET+4CSzC7Yovr6yl9qu9Pun6nkKl9gV3N8JfxH9SdHbuW6a6hXruodI01KxTmVVTeIwlLcJ11Nt1U0rslwjbLoXqHp7qRkVjN9OZph81wF6lV03bFctJqVK5X2nzm1UzM8NQ16nJfh/wDEXrbw0anpzTR+Nf6m3X/RuS3W3h8SvXyqPrKW1vyzia+zWL+76CluoLB1t8LPjh0R4k8ktWbeLpyTVtpujE5JjKouqP2aamny1OYUzsdkfNK9zhplWkENn8xEAOB5g90OVuFJgMLYAI2gcISJAKIDUhqRwAYkJ7iAAWwZI4AyI2iblSARuUnf2HcInDMiPgLgKQA3uGAmSdysiiAMicr0DHLCCYHMiApwJ29A2O8kBLuUnKHyKhO8BuCcMTzIVXwRIqZNwKyRO4b9iztyEROCxJILwFRpBosJhr3ATISgcIoEKT8CP9AFROEE9vUsQAQgNwO/sAgpA90BSLfcm645CmQLJTFQjIARqNxvIfYISGI3D/SFHwRTMl+YRAkPcNz3EehQXBiZLcdgKRh8CfvApitkWe4nYAmPwCUB/MByxz2CcjcAIlDsIfqA2RSRvLE7+wFIlADYB8iNhsyN7gXgdhI5WwDhB7oR7iACUdyPdla9hEBFJygEmRVI3Abg4O8Sfi70L4Z8j/KNQYz8sza7bdzDZPhal9PfS22n6q323aKjlXV2ssl0JkWLznPsysZZluEtVXrt+/WqYppUuFy3twtzVF4wviR511as4rSXTW7eyLTddToxOcUVNX8TSnxbah001KU01umdfPET4pNc+KHNr93UuMrwmnle+kwmRWXFmilP6jqUv60cw+WziRJpJLZUqEl2XodxX3ZWv7MaaKaKq6vrOu4/NXXW5qqfdtlLOxEjtkqA4AAj4Be3sAmBOwcIiovX8RYw2FsV4rG4itW7GHtKarlbcJL7xwquum3DrnfZJbt/JHevwKfD4xvUzE4TqB1MwNzBaZt103csyS+l5sYv90uLdeSZXlaT2ORvBX8NqnL6Mu1t1bwVF/Mmqb+G0/dUrDVelxbpvnhmyO1aos26LdFKpooSpppXZLhGczltWuOX8mT5Rg8jy7D4DAYejC4PD0Ki1Zt0+WmlLskf3RCC9RLbOWiclWwWzgNSAmSPkq2GzAxMnMMPfhjlATnYvGwgbyAEwHv8wl6gJKSBD9QIuCzCHsOAg3yRPYsygtkFEUkh7ASHJX6lI32ApitkXnuGA/ETsIQXsAXIfqUigAuCdysnKAsheoQjcA1JHMFaYfGwEexWyNbiPcAtyxsEoI3uAhocblmRAFBFwJXIB8BbLcMoRJDcCNyOZ9ApO+5Y3C3HAAcrcdxHIE43KmSAlIFgNx8hMhgPmGE5KBOUEOwQBiIJUZASYcBSSJZf2QBjsHsEEUiW5ScMCgnG4n7gEv0DQkbz7BSewDUjkAJ9QuYHJAI93Be4go/J1PpXKdZ5FjMmzvAWczyzFW3av4W/TNNdL5T/API1G+M74eeddFqcx1noS1dzrSFDqv4vL7dE3cFRy60ko8iUzL9DcR7HhxGGtYuzXZv26L1qteWq3cpVVNS9GmWJw5mMvmqw9+jEW1Xbaqpfp29jydzZd4zvhpLMbmYa06TYenD4+p1YjF5G6mrd181Ojl+Z7wlClmtK7RewuLxGCxdivB4/C3KrWIwt5eWu1XS4qpa9mmjuJyxmswPgInoZJHThj3Mp3JCgi5AyQ2jmCe45AywmLxeWZhYzDL8Zey7H2KlXaxWHqiumpOU/vNhvhT+KVicpuYDS3V7zYi3cVNqzqemrmru77bSS2/Yrlmu/kxdKqpdLplP1JMZdxbD6Q9LapyrWeRYLOckx1nMsrxltXcPisPV5qLlL7pn6ycmgLw/eKrqD4ac0tX9NZhVmGS/TK5iMjxlc2b1P7VVQ6qfsg20+GTxz6B8RuFt4KxjFk2qaaqbV3KMZFFddbU/rSluqntJnMTDaJiXZTgjfsTzJ7foHPJHTMjgpjG8AVFJ7DkCkiQlAkgn2FnYRuO/sUBz9gZJ/SBewIuQ2BQicsr2QApHLQ9AHcT6hrcfMIJhb9iJbFWyCncLlkbLG4Bjn2E7huAC33E7gJQA78iBG4bhBDgj3Y57lSgKQiKUixuUCE+wvKDcAJEv0EDhEBcegb2I2OxRZ2HCDSgPgBIJzBVsA4KR7iAEIRBJLugKR7ILcPcIPsJjhFI16BT7BKgKWwEGR7DkN7hV9A9nwA+AJ3D9C+jJ3gC7egXPA4YUkDiQnIfBJ2KKh3C2QTn5gR7ssBc78hOQHtAgTyJIHfgFJyUBOw4CcgGG4HcBBbhIJQUioNmxIKATD2CREBz3JO5dkVUWzL7CI5JPcAn2PBjMZawGGuX792m1Zt0uqu5W4VKXLZxN1/wDFNoPw55LexeqM1ppxyo81jLLEVYi83xFMrY1K+Jnx0a98R+Ov4Gi9VpfSKTooy7B1tV31P51bf1qW1GycbFiMuZtEO3Piw+KJlum6MdpbpVRbzvOHXVZvZ355w+Hpjeq26XPmTjlRyaytS6izrW2ocZn2o8yv5znOMr893F4mqX8l2j7D863bos0KmhQl9rf2lbk0iMMZtlVsJhkmQiuBpQTuUAAGiJgURKFdP1W+y3bOTvD94bdaeJjVGHynS+DqtZVTWvy7ObkqzYoT+slVDTraThPlomcQsRl6RojRmfdStW4LS+lMsvZznmMrVNGHsU+Z26e9dXslu/kbePBz8PnIOgX0GpNTfRai1pVQnTfuUTbwdUb/AEey9Wt0zlXwz+EjRXhmyFWMjwixWc3qKacXmt+mbt1r7Wlu3xHJzlSZzOW9a4TyxCS4MigjtGx7B7k47yBVvuUi4I2BfXYkdzIk7wAQT9iN7laApJC22DUgA3AXMBgA3BFuw2BZH5xHsgoTAsBBsLgBPsNmgyPYCjnsH6iQEQJTKRhD27BKBAgCkgJyUCPYdiTvuVSATH4BjlBUbngqEQTlSBWRbliRwiB3I+eCtwwUTcqclMeGBkRIpJAPlAJyUgGKWzKpDcMqECNxuUCNwUjD3CpDLEgcIAg3AHLApEGtigSfQSCgROZDHGwkIkNsrY3HAU7hvsORx8gAewe6HKggIMcBlAMpjG4FQ7hIdwC4DKT5gSe5kSE0UIkkU/MvDAVI23Opni38AGlPEJhcVneTU29O6yptuq1isPbVNu9UlKprpUL6z2dTl7ydtG4RJkJy+c7qT001T0e1RiNPaxyu5lmZWbjtfSul/QX2v2VutpKpP2PW39XmU/Q+gfrt4eNG+IPSOKyPVOWUX/paGrWMtRRfs1fsXTWlK3jZGm3xReDLXHhfxlGJxdm5n+kr112rGa4Wh11UJbzdppl0Ljeru4NIllNMcOCY79itHjt101rzU1Kqn2cnkOmSblkg4CrPsFsyP1EhCr2LYuX8LfoxGDxd/L8XS5oxWFuVW7lL9fNS0yQywgru54afig6m6YuzkXUnD1ai08vJTbzWxS3icNQtmnQl9eeZb7e5tE6YdYNJ9Ysht5vpTOcNmuGqppqrptXKXcteZSlXSm/K/Z+h871SldmvR9z2Tpz1N1Z0iz63nOjs5v5RjbdSrdlVt4e61x57c+V/b6nE19mlb+76Mk4Re5r78NPxUsh1jewunupmHeQZ7VTbt05hat+bD4i49m3C8ttd933O++VZxgc6wlGLy/G4fH4Wv82/hbtNyir5VUtpnHDWJy/tgJQFuJ3CqR7CRHoEOCk5W44QUW3JOdyv2G4B8blJ23CARuR8mRGA4EjgPcgdygj2KEirgINSA45D4HzDAkFnYbwTtsBU9ikiChEQfcCQJ2ENmRIlhVIkxG4bgBsykjYoRN2OER7yFAVVuh39hEBgF7ifQRPzC2Ancsz8gxwEJRSfIN/cRRpyRT6l/AncoyBJHKAPcOeAuA5ATATkPb5BMCeUe3cqkANxG5SNwA4W47yJTRQJJPKVoNsAiRL2DqKnIE4Y4Qll5AkSypQhEFAx4SLyhygASgQwhvABBjdDlBEfMl3fyA4QURJ7lakdgE9ybsuyHcAwimLe4FbI3CPHiMTaw1mu7euUWrVCmquupKmlerb4OoviX+I/0/6HO/lGTXP5LdUqry04TBPzWEu7d6maZW2wR2o1NqvKNHZRezTPMyw2VZda/PxOLuq3Qn2UtxJrj8UHxVqWsZpzpBhqr1+m5VZu57jKPLTbdLir6OnemtPeHPozpP1y8SnULxE5zcxWrs4rt4Dz1OzlWCf0VmmifqqumlxU0kt2vU4yoopt0qmilU0rslsdxX3ZWvjxD9PU+ps51rn+LzvUWZYjOM0xVyq7cu4mt1UpveKaW2qV7I/NnzNN88BvcHbOZyAAIJhbMFfMgQITA5AjcGGIxFvC2art2ry0Jfa/kfoZJkWaaqzjD5RkeXYjNs0vtKnD4W3VXE7TU0n5V7s2feED4ZWB0ZcyrWHVKm3muoKXTibeTqpV4bDPtTWlNNz13XeDmZw7isy61+Ev4e2qevWPwWeays39NaHodN6qzcpdOJximVT5XDppqU/WT7o289POm2nel+ncPkmm8ssZbgbNKpVNqhKqqFCdTiW/mexYfC2sJh7dmzbps2bdKpot21FNKXCS7Hl4M+W8REcEQZESgTPACORwUkBRbiBI3kBwR7iJZQEQN5KRAGpHIRQJHqI3KRAUkbjuUIncJQUncKkF7hqfkJApHsCgTsE5RSNwwE7jkpI9AE7DmBEj5gG1IYW5QiBMoCommyk4KBHwOECgSdiRsHsthP3APlwVcyOwWyApHsE5KBJJBkABO8lJ+ABP1D9h+ASh+wCQ/lIjYcAUABEfsJ5KAoCSUiI+AuA+AVSfYpB3AdwBMgGUncoEhQGGvtCcgOID4Eyx3ICHDkpJ3KhyOBIlhRvcdiRLK+ACUDhbhfoKBF+kicFbgTuA44CEbyGpZA+YgcFAkR8hKTEhOSoRLPztQaey7VOTYzKc2wdnMMuxdH0d/DYihV0XKfRp88I/SI4CtX3i3+GFewOOxGrOkVDqs3FVcxmn71SadXrae1NChJRDNdeKw+Ky3G3sDj8LewGOs1ui7hsRbdFdNSccOJPpTa81McfI6zeKbwK6J8R2XYzHLD0ZHrJ228NnNheVu7+x+l2bqp9UvQ6icM7Vy0hliGcjdd/Dxrnw46lpyrV2WVvCXvM8Jm2HomxiKVEvu1yuYON1uk5TT7o05YzGPCkMkYyEWSpSQICvYnZlnYIDxXbNF+jyXaVXQ9nTVujl7of4rupnh6x1mrTWeXMbk9HlpqyfMXVesqhPdW15kqW139kcSsjlqEOXUTMNz3h0+I/0863V4fKszqq0hqW5WrdODx9xOit/tlchUpex2zwuMsY6xbv4e9bv2a1NNy1Uqqal6prZnzUYrDW8UkrtKrdP5tT5p90dh+hXjn6rdBruFwljNq9Tacoi3+pmZN3KrNv0tbpU/b6nE1aRfPLeslJeEdWPDv8AEO6YddrWGwVzHPTOpLkU/qVmL+vU+G1Ul5Yn37naKxireKsq5arpuW6uK6Kk0/tRw05eYjInBdmFEoEFAE+YfsIQbgCkclJyA3HECNoHoAncpO4bgA3BJ3K2EkBJ33LCbElAj4InBkYt7egRfkUi2HK9CKc8gR6B8FCJEbEXBZgCkhMIIgESK9txJRGiwO5QMd5cFQ4kJyA5Hf2C9BEgUk+ofKACNh+Aa2H4APwHPYTvAbgIQkFwE0J9gotg/YP0CAbyIHCHKAN7lJBQJBI9SsnfgCxIkNSgwCkpOChE7E4K+BPZBSFA7iSgRuPkPwJLK+OAHYL9A52HAQ4CUMpJ3CkyOSkkA90O24ncnL9gip7BuAoHCCiXcNwYVXKaU3U0klLb7HBPX/xndNfD7grn6t51axecKnzWcpwlXmu3vZVJOlfawOd67ioTdTSS3bb2OvniD8bvTfw+YK8szzS3m+cO268PleX3FXXdcx5XVTKpfPJrh6+/Es6ldX7t/BaUruaG05W27f0bjHV0vby1V0t0xHsdS7jqvY69jL1Vd/GXqvPcxN1zcrfq2dRVnNscOyXiG8fHUrr3mGKwuCxl3R2k3cmxgsFW6MTXbiPLcuUtKree3odabNi3YdToUV1N1VXH+dU3y2+55U9vcJQzvGGUzMo0kNyt7kidyoFbjYg5CA5ElTAgjaSrdFwmHxOY46xgcFhb2Ox2JuU2rGGsU+aqupuF8t2uRlWFTVNLqbVKSlts5e8O3hT174lc8sYfIMHXluQKpPFZ1i7TVuij1oWzqnjb1O1PhQ+F5j9RW7Gpurj/ACTBVumrD6dtuLmzmbr3pqpajZOdmbOdLaUyfRORYTJsiy+xleVYShWrGEw1Plot0rZJI4m3s1rT3cQeGXwf6H8NORK3k2CWMz2+k8Xm+KSrvV1elNUJqnZON9znVpd5MlwJ3g45aQiWxYjgJQUKEncpFuEHuEykgKk7mRHstigSIHIkJyA3EMP2EMIJNBjgMKdxAaC4ADngi3koDuhO47hqWA577CExAj0CEQykn1QncKNjsG/YpER8eg7jnsNkVVJEgSQGE9wIKEblJIn2ANSJ9gwwKCD2AQiL22LPsFughCgoJEIAHwI3kJyFEUkAgORyJ34DZQYgMAOYD5HAQDv7CCgACTHyKBIKAECdxJQqSUi3DUhCQmI2CQUmRMBKBKYFJwwhEhCNw1swI5ALgcknb0C5IqxuEG4KBEoKRjhFDuIkJyN2EGIkMTIBeg2kcDlhVMdylAkAMN9gGzJG5UJAdibvks8kbkD1/W2gsg6i5DfybUmVYbN8tvqK8PiaZpe0fxmrfxSfC9zvQFrHal6V1XM/ylXKrtzT9VM3rdNVUv6KEl5aFPL4SNtMStzGqlNOlpNNQ0yxOEmMvmsxdi9gcdiMFi8PcwePw9bt3sLfUV26k4aZHBu/8TXgR0B4jMLfx17DfqFqj6OLWb4KlK43Svq0ul/VieXE7mprxAeFbqH4bcyu06myurGZGqfNbzvCJ1WHvEV1Qoq42S7o7i2WNquJUgvcwt3aL1tV26lXQ+KqeGZKo6ZhYj3JMsvIDaCRI7hx2AQEoe4XqOQPHfw1F9fWTVS4rpcOn5HYroT49Oq/Qiq1hVmdercgodNFOWZnW27NHD+jiN/mzr2lBi6U1uTGXUTMN0XQD4kXSzrLRawOY47+Q7PqnRapwGa10qq9cbh+TyztPr6o7X2cVav21XbuUXaP21FSaPmruWqbnl81MulzTVS3S0/WUc0dE/GH1W6C3cNZyHUFzNcitXKrleTZjUvoq21+3Sdfp37HE1aRf3b8aWql8ywdFOg/xV9B64WCy3X2H/kJz28l9LerUYGl+1dVXm/Qd1dM6ryrWWS4XN8kx1nM8sxVHnsYrD1eai5T6pnLSJfrRAa9iKpNCZYFXuIgcOChUmBIYfoAncPYRuJlwAhD5cDhBOQG3I4D2JPYCp7jlmPcvYAp7l7+wlpB7ECSbyV9pIt+5RYD/SOEI9wC9xELYjqLIBL1GyKSPtCKRkTgqckUCmQ3AfMAH7Be5JgyKJAgNwUIksm/Yr2TImkFO5WOHInYCdiocqSNgWNvcKICfASgA+AhM7DdIIoInuOdgqknfgRuGBSd/YkyPmBYkfpD5CUAORATmSgRB+w4+Q7hEiO5kYzPYebcKv2khyPUq4ANwERr3K+YCKSAxMLkB7wGz+TMMzw2VYK9i8Xeow+Fs0uu5euOKaV6s6j9cPibdKumNF/AZDjXrLO3abs0ZYlcsU3Jjy3KvMmuOwM4dwLt2ixT566lTSuaqnCR1868+OXpb0Ew2Js5nndnNc+stL9RMBcTxNU91MU+nfuateufj36tddqr+Du5hTpDT1+iq3dyzKqvN9InxLrXmTj0Z13dP16rlVVd67V+ddu1Ouqr7WdRVnNoh2069fEr6n9XPp8u0vcr0JklVVVKrw1UYu9bq2dNfNPG23qdTLnnvYq9icRduYvF3anXcxF+rzV1N8thJe5W01sdxEQzmZlFsxywOC8uTge4TK5AjBeWSAD4LsRqCxOyUvsBJ3F25RZoqruVKmlct9j+/TGnc41zntrI9MZXiM+zq7tRg8JR56pmN0bHPDH8KjD2btjUHV6/TmF1eWq1kGHqmx5WpfnqimpVJ7RJJnDuKzLpj4ePCr1A8SudW7Gnstu5dkCl38+xdDVijf8ANTW8veNuxtt8Mfgg0F4bMvw+IwWEozjU/lbvZ3jKE701L61NPby7tLaYOesi05lumMrw+XZXgrOBwVi3Tbt2rNCpSppUJe+x+lEIzmctorFRU+WFGxYJOxkRQxhyZEbgKjYhvkrSgIAIjgoAnbcMcyOAC3QgJyGAS+4JQO4nYBEMSR7oAXZiYC4C3Ad/YBknYCkS3LwIkAykbgcoB39hG5SdwHLEQO5QMe+5XPYch7AFMlBJ3gINSI+wIR7hVBJgdwHr3G8hKBMoIoAIqQJ3G8ke7ApScIN7FRSTIkJQFGJ9hJQIikl9g3CCKTv7id4CUBVIO4e4BrdCRA5Adw3A4KEY+UvuPmOPkFN5A5RQJG4mAnIAMTIYQDefYe4bC3CHI2HyEbBUbn5FJDLM8AAgmIkgcchBtCZ4KDUhjjdj5AOAykkIpO4mfkHuFTkqUDgpBGxG8hjdFCIZSciY5ApIkT37CZAR7juFJQiQEoEhsCkkie+5XIUq4Pzs+05lmpsuu4DNcBh8xwl2l0VWcTbVdLTUPlH6E8Fb7Aa4vEt8KXA5xXis+6SYyjJ8ydNTeS4qqMNcfM/SVOpr0hI1u660TqLphnjybV2TYnIcxUumnE26qKLqTh1UVVJeZT3Po+jZHH3V/oPorrjp3EZPq7JLGYWL1t2vp6aVRiKKXyqLqXmp+xnUS4msS+elbLf5oqex3a8R3wu9XdNbOLzvpziFqPILVFd+7l2IuRfsU07qmhtuq44ng6S4zD4rLMdcwWYYW/luOtNK5hcZadq5S/lVDZ3mJYzWYUP3ENNyh5kyuSNyMq9Q9wIXlEQn1Ar2CHOyItgF2ii5S1VTTUuN1J7b066w686QZpbzHR2p8dld+zSlbsXLjvWUp48tbdK+49TfAjzKHwxyseGw7or8XfG5c8Ll3VHTVX5JZt/ruc5S6r967VPLtxTStvR9jvb0q8VPTDrHhsHXpvVeAvYzFKbeXX71FGKXzt+ZtGgRt8criHwY2FXg8ZTjMFiMRluMo/NxGBvVWK6ftpaZx2tIv7vpVpqlvn7TNcGjXoz8QHrJ0dowWXW82talyCxU3cwuYW6ar1amY+mqmo7qdJvi3dO9S0KxrfLcdpPMa7qtW6LFmvE2nLiXXCSRziYaRMS77RvI9z1PRvVbSPUCxZuaf1Fluau5Qq/osNiqK7lKfrSm2j2rzEdMgluRVTBZ2AbMcBAId/YklbgPgKJiYCXcoREGpZOSgJ3ZCoNBUXoVT9hSTADuIEyxuuQhvI5HK2HAU4ZSN8CfUIcByI3HG4CB3KAqFI1I4QDfci9y7vgk+oFn7ic7ljbYSgE7CexEigII3vyZE5Aj55KnsIEwwD7MNSNwBQSPUTIQXIexFsX9kFJ2kpHtBQI3uFuGx8gE/cTllgNSAbgMbkkILdl4JKjY/D1JrbINHWqbme51gMnt1KaasdiaLKfy8zQH7rMW1G250r6yfFP6WdPljsDp78r1TnuGq8qw9mxUsPW47XVK9DpX1i+JX1e6oUYnA5Tdwmj8hxVt0vD2LdF2+pXKuwqkWIyk2iG2nqT150H0jw125qrU2X5TdoodxYa9iKKb1xJT9WltSzoz1o+L1leHqqwXS/Td7OvPTVbqx+b+bCq1VH51KXmVW5rTzTG47P8AGrF5xmWOznFb/ruPxNd7n0VTcHihJeVJUpdqVCOor7s5v7OROqPiP6nda8Vbv6v1ZjL9u235MJg6/oLaXo3R5fN9pxzZt0W15aKVSu7e7+/kyhJuCo7ZzOVhJDZsT6ECDBZ3IAAK9gIuStRyE/uJU5CjEwY3blFi267laopid+5zJ0B8I3UzxE5l5chyi5leTW/I72Z5lR9CvJV+yt01pefaeH6EnwREzw4ZuXVTcotQ67tbVNFmhTcrbcJJdztt4avhy6+63XbeZaqpvaJ0t50m7tt/ll1cv9aqShNd0/U78eGr4eXTzoIqMzxeGWqNTVJK7jswX0lrbdeW1VNNLmd0dqbdum3SqaUqUlCppUJHM2axTHLi7oh4aNA9AckWX6UyTD4e7VUq7uMuU/SXq60onzVS18kzlVKCKkqcnDQfoF6lIRVBJJyUUcjiChEfoOB7jkBG4DcBhTgMJyACchsNBqQD3CUBe3Ab9ADJGwbaRewET9yxKJ9giNwLAe4koEjcSUnYAhKQ+QW4FJyUnyAdxI5AE4ZZkch7AI3DbkNwOdgKRKAtkAKAY/IDIiUCYCkCk7+xSdwEMJ7iRAFJJG2i7AFu5EbhcD8Ag0IIlyXdBVJGwTljgByN0gmJ9QE7jkbjcIcidwJ3AJyG4HC3HO4UiRO5HzJWEGw2wuChU3kd/cpEoAPgIIMIkqS8CdpESFUjbKRgTcqgIcEB8EfBWPTYom5eQ9wgI+yLwHK+QAbk3K/QbgIgTuEUDGZReAokoEY3kPnYbgUiKRcbkQlQPlwIUhKCgmCk+ZFEHzIa4CAcjhCClEUBgPdAHuiONi9uAkBEkzgzr14OOmfiDy69Tn+R28PmVSmjM8AlYxHnX5rqrSlqexzoxGwRpT8Qnw4+pPRP8rzPIvLrLTFpuvz4eh04i1S+KfK26q2uJR1TuKvDXqsPibN7B4qhxXh8Vbdq5S/R01Qz6Vmtzr3188DfS3r9bvYnN8mWWZ3W6q1muWxav11vjz1Q5U7/AGs7iziaezRfw99mJO0nXr4cHVPo28RmGU2qNb6etUu7cv4FeS9Yo9KvO5qfHC7nVq4q8LiHhsTZu4PE0L61jE23brp39KkjuJiWU1mCQWGmJkOU4LyKkQBJeyJ3AFngNogAyS2PHXSri8tyim5QuKa1KM19xO5Vf16ezzN9G4y5i9PZxmOQ4upKbuW4mqxO/fytHZXpN8SLrT02eX5fjsdhdVZHYa+lt4myvym5Su301Tbn3OsEyyteuxzMLFphtg6ZfF06bakdy3rHKMw0dctqFU5xVNb/ALClQds9DdedB9RMusYzJNU5ZiaL8O3arxVui65/cOqf0Hz110/S0Oiv69Hel8GOW01ZLmVnMMuu3ctxtpzRfwdXkrpfrJz2u4v7vpWpu01UppympTW6HmU7M0N9PPHB1v6Y4uu/gdZV57aVKppw2fefE00pLsk0doem3xg8ZlmApt9QNEYjHYuppPF5RXbs26V3bpbbOe2XcWiW0SZ+RXwdXdAfEc6Ia4s4W09U05VmWIj+g8Xaueal+jq8vl/SdgMm6gabz2zary/Pstxn0q81FNrF0Opr5TJHWXsMsSY01Sp7MqaCspHcm0lbgBECdwwkBInlhJF42KBIgN+giQt9wh3Eb7idxAUb9BEwIKBG2Tkrcok7AUJJEnfcsBFI+AlDERIU4ROfmWftJG/sBZ3EIRLI1AF7bDyhBsBCEpE77jYDIjQTDYCdh2kR6idwCciIEbjhARclQjeSPkgvzD4JVBHWoKjJbIPg/CzXW+QZL51j87y7BV0KXTfxVFNS+xuTgbXXxDeh+hruMwmI1haxmZYaU8JhrNyp1NdlUqWv0gdlfMR1du5rK6g/GHt43LsVY0LofG2sdRU6beNzK7brs1cw/Kmn6HWHqL4/uuvUy1QsRqixpqlP8zIrdeHra935mddspNohun1T1Y0jonCYi/nOo8swP0FLqrtXMXbVzb9z5pOpvU34sfSjSWGrWmrGO1djqKnRVh7VurD0z+/qpaZqS1DmuO1hmdWY59mGLzvHV71Xsfc+kbfqfyWqFYp8lqlWqf2tGyL2s5u7hdVPij9XdaYrF2dMWsDpLI8TS6abV6zRiMRQn6XFDT9zqvqvWmpdeeSvVOpc2z+tOVTjMZXct0+ypqbhH40D0OsQ4m0yxtWqLFP6zRRa9fJTEmTe/G47DsVydyuCAKPcdg0Aiykh5tifaEAkLYgfHoBSN7swuXKLVLdypUpevP3HJHSXw6dR+ueYfk2jtL4rE2KGvpcfiaPo7Vul/soqadS+Ql1EZccV3KLVM11U0L904OSujfhx6i9e8zpwmkcgvvD+ZOvMcbQ7Vmmnu15klV9jNi3h5+FPpLRdeFzfqRi6dX51arpuU4S3KwSXLpqt1Jt7+53m07pnK9J5RYyrJsBZy3LrC8trDYeny0UL2RxNmkU93Sjw5/C20Z05WEzjXd/+THUNH11Q06cJRO7pdqrzKqNlPsd3srynBZJgLOCy/CWcDhLNKot2LFCoooSUJJLZH9iRThphGtkVCZHlCnIQe3Yn2BFSHIbhD2CpPqVKBwOAh3HsO4bgKPZEncrewfAQe5SLgJyFPUIQGgJUWAlBN2BYgNegewQCXAW6DCAfgUETkIj5LypH4DZBSXsBO4jcBwUkBuAKYrZlncRIE44KnIZQJwGGpKECQFuEFOQIgQAhSUxfIX4gVxJSIchBvYNFAVjSURuFsA4ROWVyJAcBuByOUAYTAcgUnLG4iQEbyR8lS2EQBSTEBhbqADcIRCDgoE5QSgQkEAgoIAYKSOSA9lyOPcfaGUJGzGzHG4B8CPsCbY78gUnzDD3+QFI+CkmewBcDsO8DgBxyJkbEXIReRzyNlsI9wpyUiUBgJgTJF7l5AkT7F3koAEkTBIl8gWdgHz7DkgNDnuGO/sUJgpGUCMcBiJID+4ce45EyUUi+QY7gJ3CYaCAKQ90TdSVAIEfcIEwBjXQqlDUpnAPXvwSdLvEDaxF7O8is4HO70/5tYKhU4mn7Xt+g7AdyNbhGmrr18MfqT0uuXsw0ZW9d5NVWlbweHpf5XZojd1Ory0/cdQcdhsTk+Nu4LM8HfyzHWq3bqw+KodNSqThqeOT6UXQmntJxj1e8NfTvrhljwmrdMYLMqqaKqbN90umu1U/2S8rUud9zqLOJpEvn580zHYcc8+hsD6xfCJzvKLt3F9M9SrH4Ree9Vl+cNUR3VFvyUS/RS/Q6Q9R+lus+kGY0YLW+mMfpy9cqdNu5irflt3Eu9L9DrOWc1mHrMl2glp03qPpLdauW/wBtTwXY7cCRY7ifsHMkEKQAExI7ACqQ2E/YJbgE0VN0t+VwyJFQV4L2FtYhp37dN5rjzdj+zTmaZpo/NaczyHN8bkuPo3ou4O55fK/tPFyT2BmXPWhfHf130TjVeu67xGorNMRh83uVV0x6bJHP2hPi+6vwWMS1noi1mGFp/ZZLFNTX9nUdB9pGz3XJMQ6i0ttmgPi39K9W5nRhc4yzNNIUtpVX8zrtuin3fkbZ2E0h4xOjOvcbTg8g6h5RmOKq4tUVVp/31KNB7qq8rXZ87I8VvA4a3c89NlKvnz011Uv9DOe11F30k4fUWV4tUu1mOEuqrjyXqX/GfoK5TUpTTXqnJ82OW5vmuRZhRjMrzzMMtv0tOmqzddUR++k5eyfxq9fsgdijB9T80vYWzssPiqLKpaXaVbknbLrvhvwdSff5FVSXLNOml/ixdX9MYCizjciyDUt1KHexV28q6vf6rSOUNFfGHxl6/bWr+n6w9mfrvKVXW49vPWTEusw2eeYLk6I4D4wHSDE4mixicn1FlzfNeJsW1Sv785U078RjoLn9Cd7XuXZVKmMbdVLXttJFy7MtlOFsk8ZPRTUuI+gyrqXkGOvftLeIbf4HI+R9QNP6lpVWV5xg8bS+9q5IHsU7x3HC9Tw/lllf7bQ37VIflVDezT+TQHlmCmFNxVpbGXmh7sKqUoKZMXcS5aQVymOUBk3Ae/eDF3Ke7Hnp9QL8hyPPTHKMXftr9kgMktw+ZJTdpq4ZXV9oFQgnnhcHjqxFK5aXzYR5XuNjwVYuxSm6r9tLvNSPV9TdWtIaNsV3s71Fl+W2qPzqr92EgPbltuVvfg4Gx/js6CZc66b3VLT6u0c21iHP4HFGsPit9FNL3qqcLjMfn8OE8sporT+U1IGXc5VlbSNdWq/jCaYqwvn0rovN8Vfa2WZWlTT7fm1nEGZ/F96pZnavWcLofTuWpqKbtV2/517/AJzRcSmYbc/Okj+S9nGCw1TpvYuxZf8A9S7TT+LNF2p/Hx1/1Jjq7tnX+IyPD1v/AEvlyt1Upen16GziDWfUPWHUHF04jUWrs2ze6nP69XTQp/sEi9sue+G+nXPii6V9NLjo1PrnKsoqThq7XVVv/YpnX3qb8VzpDoXEUW8leL1uqv2WUV0pf9J5TTzcw1jEeV3bP0ta/Z3LlVT/AEs81NdSt+VNKlcKEXtczf2bAuoHxgdS43EU/wAhOhVgMO/2Wd+Wtr/k6jgHqJ4/Ouuu8wV/D60uaWtd8PkldVFL/tkzr1ulzyRJpcSWKw5m8v79W6jz3X2bVZnqXPcfn+Nqc1Xcdc8zb+w/MsYazhm3atUWan3o5PMuOCRudOcyNN7vf5hLbtJWtiBF8w5DWxORAPliQwgAkAAG9i9jGUBZ2Cc+xHyVUt8LYA9gnPDLgbdzNsysZdl9i7mGPv3Fat4XC0+a5VU+FB2m6OfDY6xdT1bxWbYKnQ2WfSU+f9UZoxVdt7t0UxVS9vX2JM4dRWZdVrl2i0vr1KlvZUpNt/JI5c6LeE/qn16xGFr09pjE4HJL1yq3VneOo/WLbXsn5v0G0roJ8NvpV0YotYzHYKrWOfUVq7TmWaqK7VUy/KqGqWp9V2O1eFwdjBWvorFi3YtLii1SqV+g5mzSKe7o10F+FToXQN3C5rr2/RrjOaElcw92nzYNVLvTS0qufU7u5FkGX6byrDZdlmDtYHBYehW7VizTFNFK4SP79gphHDTjgVMFElAjA9hwAa9AGAou4akoCJAmeCk2Ck78EbKhG4QXAKSApAYj3Ee4CSkSKETkcFI+UFN+zDECQAQ4QCIu5eEF3HABFBJkB3KAFTuUkwOQKTlCB8gJ3L7TuQqApID7CQENdxPsNwgEQUkooEBSNSQGykj7RHuUUnA7kWzAs/YGI3ADgpJ3gcAUj2A5+QBcFAAm4bKSAHPASgdvQQ/UAikJMhF+0DkcAGpElMZl7BValDhFJJAbgTwIlh8FBiRMqAAjcoJ3IECAxvsUUxXJkSNwAT7D1gbsB3D4KTkgIMbyUoxSkokNAI3Hci5KgEb8hqQ1IfAQgIJhBRkmeSy5ABkahSZEbgByglA3DkBEscIbjkIdxMscfInLCsiPYcSInkBO0hBFCI1PyDe8FI9iKR7kfJU5BQSCYbHBARJkL1YZRfwI/wAQioInCHCL3gBR0pn4epNF5Hq7B3MNnOU4PMrVyh0NYmzTW0mocNqV9h+5uI2A6M9avhTdOdc1/l2j8XiND46ma3bwlP01u9VHFXnq+qvkjod1b8BPWno7dpqvaf8A5LMDcqbpxGSefEV0UetdKpSp4N63zMKrVNxVJpNVKGnuixMw5msS+am9eowmNv4PFU14LGWavJcw+JXkrpq9IPK6HTSpUTwb8+rvhN6Yda8vpwmp9LYWulV+f6bAUrC3anvu67aTfPqdJOq/wg7mEs5hmPTfVFz8obnDZPmCX0ffZ3am36HcWZzT2a5pS7Ej1OUOpvha6tdIczqwupNGY29Tbo89eNyiivF2EoneqmmEcVrGYeup0u6qLlL8rt3Pq1p+jRcwzmJh5B3K06Vump4kTsVCJCCbfAiSh3D5D3+Y7EDgTuEh3AdyNQWCRIF9ySywQBE8iFI7ACQkvkEtuX95Z9pZVAGKSTny0t+rpTJctUXKYqt0NPn6qMkJ+4K/nt5fh7Nfnot1W6v21u5VS/0M/vs5lj8NTFjM8xsf8XjrtP4VHgBMGZf2Ws+1BYu+ezqvO8O/3OMuVfjUe15L1w6j6eVKwGvs4t+XjzxV+MnpCEy4GIle6fdzdl3jY665RZpt4XqVjqaV2qwtmr8aT9Cz4/fENh6011EvYhftbuFsUr9FBwDPZkiahiDun3doMs+JL15wcfT5zg8bH+6OimfuoPYsL8UjrJZ+rXhcqvv1qxEf9g6feVKQko9B2wvdLufb+Kt1cpSTyXJ6/f8AK6v8Q8n89Y6teWP1ByafX8rq/wAQ6WqE2VOKpZO2Dul3IvfFS6v1r6uUZTb+WKqf/YPzsR8UDrRelUW8ssz6X5j+8OpD35HlpGIO+XaHGfEs673aalazLA2G+KqaqXH94etYn4gviMxV1unXf5LS+1uxZqj76DgJ0pr3Lsy4g75c53vHf4hMRQ6L3UrFOl8+XCWP8Q9Vz7xL9WNS0OnMOoWaXE+fJRRR+CRxqQYhJmfd/bidTakx2JqvYvVec4mt7ucZcoX6Kj+bEYzFY6l04rG47E0vlXcZdq/Go8fyJG5cGZeC1l+Gs1eaiyk/Wp+b8Tz+Wj9pR/aooCIvbb5Fb7NgRIQjfgnlRRABqUFwBG/sA4RWyTIjYAm0O8sQJ2ANkDlIsAOSz9hEVbsCFcELKe3cCEc9jG5etWf6Zdt2/wB/Ukz2PSPTfV3UOu0tK6WzbPKblat/T2MJcdiltxvWk0kRcTL11N1bLn0PDexFrCy712i1Hatw38ju50m+FF1M1jfVet8zwmkcru26blv8iuUYq65UxVTs6Xwd0ui3w2ukXSW5gswu5Zd1Bn2HX18Zj7tVdu44j+lVN0+pO6HcUn1ak+mXQfqN1kv4T+RDSOPx+CxNfkpzK9ZrpwtG3LrSZ3W6OfCFzLHU2cb1P1V+T3bV1V/qZlKpvWbtMcVVvy1Lf0NnGU5Hl+RYZYfLcDhcvw3azhLNNqhfZSkj+2PKznLSKxDi3pR4Y+m3RnL/AMl0vpbBYSXTVVdu0fS1upKPNNctfYcpqhUpJKElCSCTLEHLsgRvwJkT94CCkSgPcA+YKT8CPncC9ykiBO+wDd9h2G45AFBJggNoSSNixsUFwH7CAwgmO4KRUbgcISOQJMOC9ygqI3AfJSMKSPxIvbkoBOUGu5SPgAuBG4QneAg3A7bB+gABvcpEu4UZQCCFIilEa2JA3Zd5ApI7lJMhDlBFAVNmEgluUgjcCZC3+Q4KEQG4D3QXowC3JwVKBv6AFuGO4kIBidx39gpE9xELYcBBBFJIYCd4KRhSAe5FKcFkoVO7GwYcAEoEQNxyAjcP9In2JO4F7ph7MPfYcLcIpJKAqbBuBsgnIDuUxXJY3kAygj2RBHyWRCYSgojKlAcIoAxaKigYpblnYjXcJAHuyxtuR7D5gVKA3A7BcAUEDZBG4exYgJCZRQgTBOexeQikneCeYs7BVBE5KECCNxswpEFIlDG+4RSRsPmEFUncMTuBOxeEGpQXyAfIcIcCdwDaaHzHATkA0RIvAbgBEFJyH6AJDexHsXhEDkpGEoKI+5VwJEgSIZfKhAjcg/mxmBsY/D3MPiLVvEWbiiu3dpVVNS9GmcFdWvA70e6w4Wm3m2k8Nl9dLdSv5NTTg63U+7dCTZz60my8IqNW/Uz4P2Y4TEY/H6D1lT9DDeGynH2arlXsndqr/iOo/VLwm9YOjH0H8kujcRilde13J5xaS9WraccG/wDiDGq151vw+V6nXdLmaxL5qbtf5LiqsNiLd7BYinaq1jLTs1J/KqDJpv8AMitPvRujf/rvwtdLeotGLeeaLyvE4nEpqvF04elXt+6qjk6p9TvhC6GzTL6/5AdQZnprMa26vNmN94myvZUUqnb7S93u4mjVbKndQxwdsuo3wwutehsRTRkSwWuMMlNV3C004Zr+3rZ1w1X0y1pofNruXZ7o/N8vvWvz66MPXeoX9lRS1+k6zDjtmHrkIRueOjEWrldVNNflrpcVU3F5Gn8meSl+fjdfuXJUGR8Cp+WX2EfYEXkkyJKoAjCYZY9gJ3AgACtckRY9wInsAAAE7DkA+SbF4YAheQ3LAEBQwIAUBIDYAPYB7hwwHYNiRsAmAEpHIAAq3ZRO0hMrggDkr7BfcOd4IIHuV8EbVKKG+xeCTCTSbk8V/E2sPT5q7lCp9qk/0BXlnYI/ry3Jc3zv6H9SshzTNfpalSvybB3HTL4+t5YOfdBfD+646+vYO9b0xTp/K8RTLxuOu27nlX7xVKo5ysVl14SbU7x6nhvYuxh/L57tNTqcKm2/PVPyRst6X/B+sWca73ULWlebYSuhf0LktFeEqpfdOpupM7UdNvAV0V6ZYKnD4LR+Hzaqlp04jOFTiLqfr5vKidzuKT6tMGgejWvepubWMDpzSGaYuq8k6L+Kw1zD2d+/nqpj9J2o6b/CX6mattV1awz/AAOkbcp02LFFOKqqX76mpQbb8pybB5HgbeDwOHtYPC2lFuzZp8tNK9Ej+1UqZOcy77YdRek3wyejvTi5gcwxWWYnUOc2aYuXcwxFV2xW55+irlLjg7Raa0dkej8J+S5Fk+BybDf7lgcPRZpf2UpH7TaaCSOXTFJLsZkYkKQR8lb9g3sATkchBPZsAimKZQhE8jgT7DtuFG4gchJFAjUhKCd9iyBSPcPYT7AIHeCTv7lXIFBGJAJsORypHKAKSk4gdwCXqO44RFv8wLwUk7lCIxEMpF3CnJTFKeSvcAwxx8igSIE7e47yOQI2zIkbh7AEoHcpEBQRvdDuBQTcnIQSK1uOCNqQqxJSMICgjEv5gIkJQEoQYBySZ2LxyE5ApJkncyAAiCCE7hb8lInLCneSka2CAMpO4bggRIbJsitwUJI0pKRpICwE5I/kVAEoHPJSRsBQSYQTAE3TLJPmwg3JVwChUEiZD4Aie4ezLAaAJyUnAQBhuBvBSDGdwt+5YTD2RQTG/wAgoY9gC+cjkJCAHMhDuTfcA9nJeR23KBFwBKEbcgG4In95YH2AJgnbkyJ3ASG4CUB7kDZiewgRJQ7juIEwBPMVSNigRCdyPYsqQEBKCTDZU5CEe47hr3KFSeOxScckez9gLxI4HIfKCDfITDIgq8iYAakA9hO0hb7MoEnbcckclifYIdxO4cyICkwHygSHIFQmOSkaAPdDdofaAhHqymPPsXhBVMZgfaUDF0xv3PBjMDYzHCXcLirVN/D3aXTXbuKVUnymf0wICOvmu/Ad0Q13h8V+U9P8nweOxDbrx2EwypvS+/mOuWtvg/aSeXXKdF6rzPKsbXPl/VC757S+ymmTYfDEbeoMNM/UD4WHWLQuX1XsozHK9aXIbVjB2blNx+01wpOA9a+HPq103wLxGqOnma5dbpTf0lKoqpj1iltn0Juil7unf1PHcw1u+ouW6bi/d0pnXc5mkS+a25OFtebFWb+DfpfsV0/xFs1K9R5rdVNdPrJ9D+ueiuiOpWG/J9S6ZwGbWYjyX6Gtv7Fo4K118NLoVq7L6sNgdI2NNXav/astnzr+2bRe5z2NKsNLiPkXt3NnGpfg6adw2Cq/ka17ndrEOYoxqtfRr0/Nok4dzT4R3VnKFir+D1RkWaWaZdu1cVz6SpemySkvdDnsl0ofzFJzlqbwNdfchxjs2+nGYZraT3v5dbTpf9tUcZ6q6Ua60N5ln+is7yt0/nfTWqdvubLmHPbMPWSyj+e3iqX+fbvYeOVdt1L+IlWY4Smry/lNE+kNFymJf0JyDC3cV9L6Jq4vZnkdu5TzQ0EQnBG2mWdgKQxVa7mSXvLKp3KWF6hJfMiMUuSkewe8AOBuJSgSkBZEmLrW/MB1pJRyBl2QMG24MlTXU/q0t/IKrYJ5K6fzqWvmzx3b9u1+fdpt/NhHl+Q+w8FrH4S4opxdtv2Tf8QqxD8ypt2b+JbcJWrdW/6BlcS845Z7hpToz1D1wqXkGg88zTzcfRWqd/vaPe8k8EvX7OcbRaq6X5ll1qpx9NjbaVK+6oZXtlwpHoXyv0O5eUfCf6xZ9hrd69nmRZK3u7VxXfOv0M5b0X8HnD38K6NX9Qcz+la3WVK35f7+g57l7Ja2a15aXVU0ku/mRhh71vFN02q6rtS/YW7dVT/QjcZ0/wDhWdGNF1ebM8FidW+v6qxv/aQc7aG8LPSnpxdpu6a0NleU3FuqrVNTf99UydzrsaItI9NtZa/xiwuntH5tmt7hfR2/Im/7KDnTp38OLrnrrH/k+aZDa0dh29sRmtHnUf2DZu2s5bhsMkrWHtWkuPJQkf0qhd9yd0uuyIazenPweXh661rvXVWPtVfsMk89pJen16TsR05+Gn0M0JY+jxWk8Pqev/ds6t03qvvhHauEiOSZy7iHrui9A6f6e5Ysu05k+EyXAKIsYO35KV9h7A7ab3392ZdivgipTSqeNhzwPxKgHuSSsJAInkJklyVLcIDsEvUNbBSdvUTIfYIBMscINbCJQDnkLYQO4QYkjcjjYKyBFwR+4FexG16FDQQ5QZNyv5BU7FkTvAc9gKROR2HDAcL1IvuKt0I39gEjkOAmENwxuhsFJ2DG3A7gF6iQ9mGA+QRI9yhBMnPDLCCgKRIDEoBvJSLfsO4B7FI0R/MAueSxuRciIYF+0k7FhCJAnsVCEIgCk7EmfYvIDsEAEGUk7gKMk8FS+0kMChOQt0OCAvmJ9hwOUUFt3DQgm4RSmPDK+AqeYd9xBUttwInCKhtwSPvAfsivYj/SWJQCdykiBIQbgcMfgFAUn2AY7BDvsUiRQrF7bIqcjuUCRA4QSgQAW6BQQRqQGGpKhMhiPsKFRKCkCUBBcApI9wpI7kiUVIBPIngEArUhchDuAgFIEEwtxyUCJyHsJjkPcKNSG4EQgl6gFJJ3DUFlP5gSd0UJQGpANEloyJG5BFI7lY5KJDkrXoGu4TkB29Q/UT6BKAhzuFuikCjcBvgoAxb3Qn7iwIARsI9w1ISgA9mG4EiAgnJHMFeyJuwq9h2CKBO3G4kSRvcDIkDjuT2Asb+wmRxsEBOGV7uAnJQIkUiHcAuOSklQUAY8OCpQIATIQiH7CNgD27EfJYEQERJciqlNblaTZOAqKlRtsfw4nIMuxrf5TgcLiW/91sU1fij9CZKEer5l010rm2Hrs4nTmV3bdShr8loX4I4u1H4Heh+rbzu5t0+y7E3H3pruUf8AVqRzwxz23Bh1Wzv4anQPMrDt4PRVjK6/90sXr1TX31nGGo/hBdM86l4HP81yV9nYtU1x/bVHfePvKnIyYa4v5zFpe1S/ouqWoV6J4KxB+FnXwdblmn/MrqPj71X/AAnD2qV+hGzlQ3JYQymIak8f8IbqBRP5FrTB3F2+ldK/Cg/AxXwkes6b/J9TZFcXb6TENfhbNxXlSJt6IuZO2Jaan8JPrv2zzTT+eLr/AMmP50x14S/1W0xV88ZX/kzcr5U9yqncvdJ2w00P4TXXj/5lpZ//ALbc/wAmV/Cc68L/AN5aW+zG3P8AJm5ZpDyqNx3SnbDTSvhM9eKv/eml1/8Attf+TLR8JXrs2/NnOmaV+5xlf+TNykehfIid0nbDTtgvhI9Z6rkYrUmRWqf/AKWIbf6bZ7blXwg9X3HT+qWurdlfsvyemiqPvpNrnlUhr2GZO2GtrLvg35ZftL9UOp2c0VelnB2Gj+zD/Be0ZavfSX+pGoMUu9NWEspP7mbGUvbYsjMr2w6Sac+FB0iyaq28d+V50qYlYhOnzfPy1HIWE+HJ4fMPTSq+nmEvVL9lXiL/APjnZjhlRMrhwpprwbdHNJVUvKtBZbhocqXXX/1qmck4Lp7prAWKbVjT2V26KdqUsJbcfej2JOR7DJh/BhMlwOB/0vg8PY/4qzTT+CP7XSqluX2L3CoqFTwFG5WRcBFe+xKWVIoVEO4jcQEGpDQiChWKWxU+wljkIbSUncnHcKoUlJ3AdxJSLcIpOSk2ewUSDcEjcvADd+w3chiAG5O8lfKQXAD5CSPZFTApHsvUpOFvuA7BCdhzuA7lInIkBxJJn2MiMA3CCclIBSMFCMY+8vuHuICkjhlIwHuiJ7lXACD7B8DhCZQVF6FbgjXuWQC9QUhBEwluZEbKg3BTGJ7lQU7kfuWd4DQE7hzIUmQE55HcpGpARuNxuUDHkqERwGAaCUFARI3CUFI+fcA9h8xGxEwp2ZeUIlDjYAt0RyVBAG4KYzBe4FI+B3aERwQR8DdlkpROA0UjQRF6yWZCDQUew3fYbkiAKnI7juN17gJDCKBJCclI5AdygAT3JMlj0HcBwikkoESgCNydgERsVyEJ3ACYEKSgRKAw99gwDnsIgLgcMAg1InkSA4kLgNSO4E9mWXO453DAcMPcfMoE7BSUj2AcInJeQ1uBSRuG4CID3CRQUR7hyx3kNwERJyUJyNpYU7bifRCEEwE7hSFIXAQ3Ev7RMclCpA4YZO/uBkSN5C3QSgCkYYmQguCkhDlhRiNhO4akCRD2LAXoUCRsI2CDn1AbMNiPQQAKTuG4AfITvBJhlkAhG5SQkwHG45QbgTtsAE7iA3ADkcEjuivjcBHcd/YSIkBG4jYKOAkARSQGpCCUSEoC2KFRc7h9iRz6lcwA77CO4D3CG7HPAmB6xyFAEp5KBOdhwiPkr3AbwE9h2JP3AWWuSLdl7jswESGSkrcgOUEtwuCgSZYj1ED2APgJCEUDH9kZAnABuPkUEhJgGRbFYYBlJH3CADiCk7yOQKYrdsrUk3gCxLDQXAbgCk2kj3YXIGRO5E4ReUAmWO5N5De4GRO45QgBIRI+wsgGtw9gxMv2ABqR5d5ESwD3Cf3Djgj5AqKSeCgSd4DUsbz7FAjQ3KSSAx39iLdljYokMvATgbSBOS7kiTIARuGG4E+oQXqIkpFyFR7FXuigCNwHzsGpEtAI+8m5ZSZG0wLMBuAl6iAhG8lJ3D4CjQXATEAJgVEfITiQKhG4TkNSAa3lAc8iQKRoBqUA5Qgi3Re4ANFMdoAR95VPckMqcgUjcBKCPnYDIE43G7ATLHcRA2TAMdg4bDYDfuUnK3KAJIYSlAUkjj5DaQDZOdy87iFACdik5E7wAfqEwu4hAJhFMY39i+yAQPKN9wgD2QW5HyVyAiNxshwRgZAinuIYDn5DgfYEvUCmMNlQcgEoKTlhSAjaCcdyvgJJhBOSNyzIxjcKyI3AfPAAMTEDuGECkT9ShUQmSmKkC8hMPaCdwi8sIQGFIkkOSrYje4GRI3CfqG4Ih7CIJ3kN/YVRclXMhrYRsAbCknCG4FakP0E7e4S9QKYzDKxELgBVwTuVLYJAI3CUBvkKe5AbgpGUoGMlbhj5gSeRx2KkNgDkpE9w57AO4akTBQgSeCkYVSeYbIkAV7k9ipbhoBwHwUnsBPMWZWwSJvOwBL33LG5FyZARIRA7hOSAnuEoHf2ElDZh+oAE5KthAUkDngPgm5X2KCUEcwZE+fAQbgdx2CXsRSd+BG4CkoNbCCk7+wQ5cidwEvUKBqR39ihEYQDnsAQXuEg2ADHuhG3uBFyVsikvLCpPoVckangvAB7hh+wZBJZUOwXuUGpIuTIxaIL3nkconsZFEWyHKKR7AOEEIEBBvsSOxY2C4ClQ5Qf3jefYIcIcIPkm4VkY8r0LuF7gE5KSBvJAW2xSdw3BQUCNxG5HMgWYE7Be4CC2QbgpNmRSdxGxSFRFJe5FwJSCq1I4Et9hEgHxsAhG4CYZE9wy7ANxLQS9xEkDiSOYG6G5RW4CcoOAlsAb2ErgNbEaAJSVOQSGgLO4iQ/YoAEiCLkDIncMe4Dh+xSNSgpABPsOOQ0A5JwXcQAgFAE3gJyE/vCUAHwEtg3uUCJQThQWfYcogRKEwUxcgXhlJGw7FBuCkgP2ANSUkspESAGE/vKpxsOR3CWwFI1CKTlAHKXuJCWwbgI//9k=';

  const handlePreviewPrintCarRepair = async (req: RequestItem) => {
    try {
      setLoadingDb(true);
      // اقرأ أحدث بيانات الإرسالية المحفوظة سحابيًا قبل إنشاء النموذج.
      const { data: dispatchData, error: dispatchReadError } = await supabase
        .from('maintenance_dispatch_records')
        .select('*')
        .eq('request_id', Number(req.id))
        .maybeSingle();
      if (dispatchReadError) throw new Error('تعذر قراءة بيانات الإرسالية المحفوظة: ' + dispatchReadError.message);
      const printReq = {
        ...req,
        workshop: dispatchData?.workshop || req.workshop,
        engineer: dispatchData?.engineer || req.engineer,
        faultType: dispatchData?.fault_type || req.faultType,
        requiredWork: dispatchData?.required_work || req.requiredWork,
      };
      const vehicleKey = String(printReq.vehicleId ?? '').trim();
      const vInfo = fleet.find(v => String(v.carNumber ?? '').trim() === vehicleKey || String(v.id ?? '').trim() === vehicleKey);
      if (!vInfo) {
        throw new Error('لم يتم العثور على السيارة رقم ' + (vehicleKey || 'غير محدد') + ' ضمن بيانات الأسطول المحمّلة. حدّث بيانات الأسطول ثم أعد الطباعة.');
      }
      const company = escapeHtml('الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة - تعز');
      const department = escapeHtml('الخدمات الإدارية');
      const date = escapeHtml(printReq.date || '');
      const requestNo = escapeHtml(printReq.id || '');
      const workshop = escapeHtml(printReq.workshop || 'ورشة المركز الرئيسي');
      const carNumber = escapeHtml(printReq.vehicleId || '');
      const carName = escapeHtml(vInfo?.name || '');
      const carType = escapeHtml(vInfo?.type || '');
      const model = escapeHtml(vInfo?.model || '');
      const driver = escapeHtml(printReq.driver || '');
      const fault = escapeHtml(printReq.faultType || '');
      const requiredWork = escapeHtml(printReq.requiredWork || '');
      const client = escapeHtml(printReq.client || 'الجهة المعنية');
      const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; }
            body { font-family: Tahoma, Arial, sans-serif; color: #161616; font-size: 12px; margin: 0; direction: rtl; }
            .top { display: grid; grid-template-columns: 1fr 100px 1fr; align-items: center; gap: 8px; min-height: 92px; }
            .company { text-align: right; font-size: 16px; font-weight: 800; line-height: 1.7; }
            .dept { font-size: 13px; font-weight: 700; }
            .logo { width: 88px; height: 88px; object-fit: contain; justify-self: center; }
            .meta { direction: rtl; text-align: left; font-size: 12px; line-height: 2; font-weight: 700; }
            .title { text-align: center; font-size: 19px; font-weight: 800; text-decoration: underline; margin: 5px 0 13px; }
            .panel { border: 1.3px solid #333; padding: 11px 13px; margin-bottom: 9px; break-inside: avoid; }
            .salute { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 10px; }
            .text { line-height: 2; }
            .field { margin-top: 8px; line-height: 1.9; }
            .line { border-bottom: 1px dotted #555; min-height: 24px; margin-top: 3px; }
            .vehicle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 18px; margin: 8px 0; }
            .signatures { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-top: 24px; font-weight: 700; }
            .sig { min-width: 26%; }
            .sig-line { border-bottom: 1px dotted #444; height: 22px; margin-top: 8px; }
            .approval { text-align: center; font-weight: 700; padding: 13px 0; }
            .small { font-size: 11px; }
          </style>
        </head>
        <body>
          <header class="top">
            <div>
              <div class="company">${company}</div>
              <div class="dept">${department}</div>
            </div>
            <img class="logo" src="${COMPANY_LOGO_DATA_URI}" />
            <div class="meta"><div>التاريخ: ${date}</div><div>الرقم: ${requestNo}</div></div>
          </header>
          <div class="title">طلب إصلاح سيارة</div>

          <section class="panel">
            <div class="salute"><span>الأخوة / ${workshop} المحترمون</span><span>بعد التحية،،،</span></div>
            <div class="text">الرجاء إجراء ما يلي على السيارة المذكورة أدناه وإفادتنا بتقرير يوضح نوع العطل وسببه:</div>
            <div class="vehicle-grid">
              <div><b>اسم السيارة:</b> ${carName}</div>
              <div><b>رقم السيارة:</b> ${carNumber}</div>
              <div><b>نوع السيارة:</b> ${carType}</div>
              <div><b>الموديل:</b> ${model}</div>
              <div><b>السائق:</b> ${driver}</div>
              <div><b>الجهة المعنية:</b> ${client}</div>
            </div>
            <div class="field"><b>نوع العطل:</b><div class="line">${fault}</div></div>
            <div class="field"><b>العمل المطلوب:</b><div class="line">${requiredWork}</div></div>
            <div class="signatures">
              <div class="sig">الخدمات الإدارية<div class="sig-line"></div></div>
              <div class="sig">مدير الإدارة<div class="sig-line"></div></div>
              <div class="sig">السائق<div class="sig-line"></div></div>
            </div>
          </section>

          <section class="panel">
            <div class="salute"><span>الأخوة / الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة</span><span>المحترمون</span></div>
            <div class="text">بعد فحص السيارة الموضحة أعلاه تبين أن بها ما يلي:</div>
            <div class="field"><b>نوع العطل وسببه:</b><div class="line"></div><div class="line"></div></div>
            <div class="field"><b>وتحتاج إلى قطع الغيار التالية / الأعمال المطلوبة:</b><div class="line"></div><div class="line"></div></div>
            <div class="signatures"><div class="sig">مسؤول الورشة<div class="sig-line"></div></div><div class="sig">التوقيع<div class="sig-line"></div></div></div>
          </section>

          <section class="panel">
            <div class="salute"><span>الأخوة / الجهة المعنية</span><span>المحترمون</span></div>
            <div class="approval">نوافق على الإصلاح.</div>
            <div class="signatures"><div class="sig">الجهة المعنية<div class="sig-line"></div></div><div class="sig">الخدمات الإدارية<div class="sig-line"></div></div></div>
          </section>

          <section class="panel">
            <div class="salute"><span>الأخوة / الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة</span><span>المحترمون</span></div>
            <div class="text">تم إصلاح عطل السيارة المذكورة أعلاه وتم تسليمها للسائق: ${driver}.</div>
            <div class="signatures"><div class="sig">مسؤول الورشة<div class="sig-line"></div></div><div class="sig">توقيع المستلم<div class="sig-line"></div></div></div>
          </section>
        </body>
        </html>`;
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
      else Alert.alert('تم إنشاء النموذج', 'تم إنشاء ملف PDF، لكن المشاركة غير متاحة على هذا الجهاز.');
    } catch (e: any) {
      Alert.alert('تعذر إنشاء إرسالية الصيانة', e?.message || 'تحقق من بيانات السيارة والطلب.');
    } finally {
      setLoadingDb(false);
    }
  };

  const handlePreviewPrintPunctureService = async (req: RequestItem) => {
    const vInfo = fleet.find(v => v.carNumber === req.vehicleId);
    const html = `
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Cairo', Tahoma, Arial, sans-serif; padding: 20px; color: #263238; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #C0272D; padding-bottom: 10px; margin-bottom: 15px; }
          .right-title { font-weight: bold; font-size: 16px; color: #C0272D; }
          .sub-title { font-size: 13px; font-weight: normal; margin-top: 4px; }
          .center-title { text-align: center; font-size: 20px; font-weight: bold; margin: 15px 0; text-decoration: underline; }
          .left-info { font-size: 13px; text-align: left; }
          .section { border: 1px solid #ccc; padding: 12px; margin-bottom: 15px; border-radius: 8px; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="right-title">الشركة اليمنية لصناعة الطلاء ومشتقاته المحدودة</div>
            <div class="sub-title">الخدمات الإدارية</div>
          </div>
          <div class="left-info">
            <div>تاريخ الطلب: ${req.date}</div>
            <div>رقم العملية: ${req.id}</div>
          </div>
        </div>

        <div class="center-title">طلب خدمات بنشر</div>

        <p>الإخوة / <b>${escapeHtml(req.client || 'مزود الخدمة')}</b> المحترمون،،،</p>
        <p>بعد التحية،،</p>
        <p>يرجى عمل الخدمات أدناه للسيارة الموضحة بياناتها أعلاه:</p>

        <div class="section">
          <div><b>رقم السيارة:</b> ${escapeHtml(req.vehicleId)} &nbsp;&nbsp;&nbsp; <b>اسم السيارة:</b> ${escapeHtml(vInfo?.name || '')}</div>
          <div style="margin-top: 5px;"><b>السائق:</b> ${escapeHtml(req.driver)}</div>
          <div style="margin-top: 10px;"><b>الخدمة المطلوبة:</b> ${escapeHtml(req.serviceDescription || req.notes || '')}</div>
        </div>

        <div style="text-align: left; font-weight: bold; margin-top: 40px;">
          الخدمات الإدارية
        </div>
      </body>
      </html>
    `;
    try {
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر الطباعة أو المعاينة');
    }
  };

  const saveCodingItem = () => {
    if (!codingModal || !newItem.trim()) return;
    const setter = codingSetters[codingModal];
    if (!setter) return;
    setter(prev => [...prev, newItem.trim()]);
    setNewItem('');
  };

  const deleteCodingItem = (key: string, index: number) => {
    const setter = codingSetters[key];
    if (!setter) return;
    Alert.alert('تأكيد الحذف', 'هل تريد حذف هذا التكويد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => setter(prev => prev.filter((_, i) => i !== index)) }
    ]);
  };

  const setVehiclePermission = (vehicleId: string, key: keyof PermissionSet, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [vehicleId]: { ...(prev[vehicleId] || DEFAULT_PERMISSIONS), [key]: value }
    }));
  };

  const exportExcel = async (rows: RequestItem[], filename: string) => {
    const header = 'الطلب,السيارة,السائق,النوع,التاريخ,الكمية,التكلفة,الحالة,المرحلة\n';
    const body = rows.map(r =>
      [r.id, r.vehicleId, r.driver, r.type, r.date, r.qty, r.total, r.status, r.workflow || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const uri = `${FileSystem.cacheDirectory}${filename}-${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(uri, header + body, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'تصدير التقرير' });
  };

  const exportPdf = async (rows: RequestItem[], title: string) => {
    const html = `
      <html><body dir="rtl">
      <h2>${escapeHtml(title)}</h2>
      <table border="1" cellpadding="6" cellspacing="0" width="100%">
      <tr><th>الطلب</th><th>السيارة</th><th>النوع</th><th>التاريخ</th><th>التكلفة</th><th>الحالة</th><th>المرحلة</th></tr>
      ${rows.map(r => `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.vehicleId)}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.date)}</td><td>${money(r.total)}</td><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.workflow || '')}</td></tr>`).join('')}
      </table></body></html>`;
    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
  };

  const renderSelect = (
    label: string, value: string, options: string[],
    setter: (v: string) => void
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
        {options.map(o => (
          <TouchableOpacity key={o} onPress={() => setter(o)}
            style={[styles.choice, value === o && styles.choiceActive]}>
            <Text style={[styles.choiceText, value === o && styles.choiceTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCoding = () => (
    <View>
      <Text style={styles.sectionTitle}>التكويدات</Text>
      <Text style={styles.helper}>إضافة وتعديل وحذف التكويدات المستخدمة في الطلبات.</Text>
      {Object.keys(codingMap).map((key, i) => (
        <TouchableOpacity key={key} style={styles.menuCard} onPress={() => setCodingModal(key)}>
          <View style={styles.menuIcon}><Text style={styles.menuIconText}>{['⛽','🛢️','🔋','🔧','🛞','🏪','🛠️','🏭','👥','👨‍🔧','🚙','🧭','📍'][i] || '🧩'}</Text></View>
          <View style={{flex:1}}>
            <Text style={styles.menuTitle}>{key}</Text>
            <Text style={styles.menuSub}>{codingMap[key].length} عنصر</Text>
          </View>
          <Text style={styles.chevron}>‹</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPricing = () => {
    const pricingGroups: Record<string, { icon: string; items: string[] }> = {
      'تسعير الوقود': { icon: '⛽', items: fuelTypes },
      'تسعير الزيوت': { icon: '🛢️', items: oils },
      'تسعير قطع الغيار': { icon: '🔧', items: parts },
      'تسعير الصيانة': { icon: '🛠️', items: maintenanceItems },
      'تسعير البطاريات': { icon: '🔋', items: batteries },
      'تسعير الإطارات': { icon: '🛞', items: tires },
    };
    const selectedItems = pricingCategoryModal ? pricingGroups[pricingCategoryModal]?.items || [] : [];
    return (
      <View>
        <Text style={styles.sectionTitle}>الأسعار</Text>
        <Text style={styles.helper}>اختر نافذة التسعير المطلوبة ثم أضف أو عدّل سعر كل صنف.</Text>
        {Object.entries(pricingGroups).map(([title, group]) => (
          <TouchableOpacity key={title} style={styles.menuCard} onPress={() => setPricingCategoryModal(title)}>
            <View style={styles.menuIcon}><Text style={styles.menuIconText}>{group.icon}</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.menuTitle}>{title}</Text>
              <Text style={styles.menuSub}>{group.items.length} صنف</Text>
            </View>
            <Text style={styles.chevron}>‹</Text>
          </TouchableOpacity>
        ))}
        <Modal visible={!!pricingCategoryModal} transparent animationType="slide" onRequestClose={() => setPricingCategoryModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{pricingCategoryModal}</Text>
              <ScrollView style={{maxHeight:480}}>
                {selectedItems.map(item => (
                  <View key={item} style={styles.priceRow}>
                    <Text style={[styles.cardText,{flex:1}]}>{item}</Text>
                    <TextInput style={styles.priceInput} keyboardType="numeric" value={String(prices[item] ?? 0)}
                      onChangeText={v => setPrices(p => ({ ...p, [item]: Number(v.replace(/[^\d]/g, '')) || 0 }))} />
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPricingCategoryModal(null)}><Text style={styles.btnText}>حفظ وإغلاق</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderRequestsAdmin = () => {
    const requestTabs: Array<[string,string]> = [['وقود','وقود'],['زيوت','زيوت'],['قطع غيار','قطع غيار'],['صيانة','صيانة'],['إطارات','إطارات'],['بطاريات','بطاريات'],['إرسالية صيانة','إرسالية صيانة'],['إرسالية خدمات بنشر','إرسالية خدمات بنشر']];
    
    const rows = requests.filter(r => {
      if (r.type !== adminRequestTab) return false;
      const isFinalApprover = isRequestApprover(currentUser);
      if (isFinalApprover) {
        // ميثاق يرى الطلبات المحالة للخدمات وكذلك الطلبات المعتمدة نهائياً حتى يتمكن من طباعتها.
        return (
          r.directManagerStatus === 'موافق' &&
          r.servicesStatus !== 'مرفوض' &&
          r.status !== 'مرفوض'
        );
      }
      const isPendingDirectApproval =
        !r.directManagerStatus ||
        ['تحت المراجعة', 'بانتظار المراجعة', 'قيد المراجعة'].includes(r.directManagerStatus);
      const requestVehicle = fleet.find((v: any) => String(v.id) === String(r.vehicleId));
      const managerAssigned = String(requestVehicle?.directManagerId || '');
      const currentProfileId = String(currentUser?.authId || currentUser?.profile?.id || '');
      const assignedToThisManager = !managerAssigned || managerAssigned === currentProfileId ||
        String(requestVehicle?.directManager || '').trim() === String(currentUser?.name || '').trim() ||
        String(requestVehicle?.directManager || '').trim() === String(currentUser?.username || '').trim();
      return (
        isPendingDirectApproval && assignedToThisManager &&
        r.status !== 'مرفوض' && r.status !== 'تمت الموافقة'
      );
    });

    return (
      <View>
        <Text style={styles.sectionTitle}>طلبات الخدمات والاعتمادات</Text>
        <Text style={styles.helper}>إدارة طلبات الأسطول الواردة ومتابعة حالة اعتمادها.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.requestTabs} contentContainerStyle={{flexDirection:'row-reverse'}}>
          {requestTabs.map(([label,type]) => (
            <TouchableOpacity key={type} onPress={() => setAdminRequestTab(type)} style={[styles.requestTab, adminRequestTab === type && styles.requestTabActive]}>
              <Text style={[styles.requestTabText, adminRequestTab === type && styles.requestTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {rows.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد طلبات من هذا النوع حاليًا.</Text></View> : null}
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
            <Text style={styles.cardTitle}>طلب {r.type}</Text>
            <Text style={styles.cardText}>رقم السيارة: {r.vehicleId}</Text>
            <Text style={styles.cardText}>السائق: {r.driver}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date}</Text>
            <Text style={styles.cardText}>الكمية: {r.qty}</Text>
            <Text style={styles.cardText}>القيمة: {money(r.total)}</Text>
            {r.station ? <Text style={styles.cardText}>المحطة: {r.station}</Text> : null}
            {r.notes ? <Text style={styles.cardText}>الملاحظات: {r.notes}</Text> : null}
            {r.faultType ? <Text style={styles.cardText}>العطل: {r.faultType}</Text> : null}
            {r.requiredWork ? <Text style={styles.cardText}>العمل المطلوب: {r.requiredWork}</Text> : null}
            {r.serviceDescription ? <Text style={styles.cardText}>وصف الخدمة: {r.serviceDescription}</Text> : null}
            <Text style={styles.workflowTitle}>المرحلة: {r.workflow || 'المسؤول المباشر'}</Text>
            {r.imageUri ? <View><Image source={{uri:r.imageUri}} style={styles.requestImage} /></View> : null}

            {(r.type === 'إرسالية صيانة' || r.type === 'إرسالية خدمات بنشر') && isRequestApprover(currentUser) && r.status !== 'تمت الموافقة' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#0F766E'}]} onPress={() => openDispatchEditor(r)}>
                  <Text style={styles.btnText}>تعديل الإرسالية وحفظها</Text>
                </TouchableOpacity>
              </View>
            )}
            {r.type === 'إرسالية صيانة' && (r.status === 'تمت الموافقة' || isRequestApprover(currentUser)) && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB'}]} onPress={() => handlePreviewPrintCarRepair(r)}>
                  <Text style={styles.btnText}>معاينة وطباعة نموذج الإرسالية</Text>
                </TouchableOpacity>
              </View>
            )}
            {r.type === 'إرسالية خدمات بنشر' && (r.status === 'تمت الموافقة' || isRequestApprover(currentUser)) && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB'}]} onPress={() => handlePreviewPrintPunctureService(r)}>
                  <Text style={styles.btnText}>معاينة وطباعة نموذج الإرسالية</Text>
                </TouchableOpacity>
              </View>
            )}

            {r.status !== 'تمت الموافقة' && r.status !== 'مرفوض' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.success}]} onPress={() => advanceRequest(r.id)}><Text style={styles.btnText}>اعتماد / قبول</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.danger}]} onPress={() => rejectRequest(r.id)}><Text style={styles.btnText}>رفض</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderRequestManagersAdmin = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>مسؤولي الطلبات</Text>
        <Text style={styles.helper}>إدارة المسؤولين، صلاحياتهم، ومسارات مسار الاعتمادات.</Text>
        <TouchableOpacity style={styles.importBtn} onPress={loadSupabaseData}><Text style={styles.btnText}>تحديث قائمة المسؤولين والسيارات</Text></TouchableOpacity>
        <View style={{flexDirection: 'row-reverse', gap: 6, marginBottom: 15}}>
          {['توزيع المسؤولين', 'قائمة المسؤولين', 'الصلاحيات', 'مسارات الطلبات'].map((tab, idx) => {
            const keys = ['distribute', 'list', 'permissions', 'routes'];
            const active = requestManagersTab === keys[idx];
            return (
              <TouchableOpacity key={keys[idx]} onPress={() => setRequestManagersTab(keys[idx])}
                style={[styles.choice, active && styles.choiceActive, {flex: 1, alignItems: 'center'}]}>
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {requestManagersTab === 'distribute' && isRequestApprover(currentUser) && (
          <ScrollView style={{ flex: 1 }}>
            <View style={styles.adminAssignBox}>
              <Text style={styles.adminAssignTitle}>
                🛡️ توزيع المسؤولين على السيارات
              </Text>

              {fleet.length === 0 ? <Text style={styles.emptyText}>لا توجد سيارات محمّلة. اضغط تحديث القائمة أو تحقق من صلاحيات جدول vehicles.</Text> : null}
              {fleet.map((v: any) => (
                <View key={String(v.id)} style={styles.assignRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', textAlign: 'right' }}>
                      السيارة رقم {v.carNumber || v.car_number || v.id}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      textAlign: 'right'
                    }}>
                      المسؤول المباشر: {v.directManager || 'غير معيّن'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.smallAssignBtn}
                    onPress={async () => {
                      setSelectedVehicleForAssign(v);
                      setChosenDirectManager('');
                      const { data, error } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, role, is_active')
                        .eq('is_active', true)
                        .order('full_name');

                      if (error) {
                        Alert.alert('تعذر تحميل المسؤولين', error.message);
                        return;
                      }
                      const eligible = (data || []).filter((m: any) =>
                        ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())
                      );
                      setAvailableManagers(eligible);
                      if (!eligible.length) Alert.alert('لا يوجد مسؤولون', 'لم يُعثر على حسابات مفعّلة بأدوار مسؤول أو مدير في جدول profiles.');
                      setManagerAssignModal(true);
                    }}
                  >
                    <Text style={styles.smallAssignText}>
                      تعيين / تغيير
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {requestManagersTab === 'list' && (
          <View>
            <Text style={[styles.sectionTitle, {fontSize: 16}]}>قائمة المسؤولين الحاليين</Text>
            {managerProfiles.filter(m => m.is_active !== false && ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())).length === 0 ? <Text style={styles.emptyText}>لم تُحمّل حسابات المسؤولين. اضغط تحديث القائمة، وإذا استمر الفراغ فتحقق من صلاحية SELECT على profiles.</Text> : null}
            {managerProfiles.filter(m => m.is_active !== false && ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())).map(m => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.cardTitle}>{m.full_name || m.username}</Text>
                <Text style={styles.cardText}>اسم الدخول: {m.username}</Text>
                <Text style={styles.cardText}>الدور / الصلاحية: {m.role}</Text>
                <Text style={styles.cardText}>الهاتف: {m.phone || 'غير متوفر'}</Text>
                <Text style={styles.cardText}>الحالة: {m.is_active !== false ? 'مفعل' : 'موقف'}</Text>
              </View>
            ))}
          </View>
        )}
        {requestManagersTab === 'permissions' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تخصيص صلاحيات المسؤولين</Text>
            <Text style={styles.cardText}>يمكنك هنا تحديد أنواع الطلبات التي تصل لكل مسؤول بدقة وتفعيلها أو إيقافها.</Text>
            {managerProfiles.filter(m => m.is_active !== false && ['manager', 'direct_manager', 'admin', 'services_manager', 'مسؤول', 'مدير', 'مدير الخدمات'].includes(String(m.role || '').toLowerCase())).map(m => (
              <View key={m.id} style={[styles.inlineRow, {justifyContent: 'space-between'}]}>
                <Text style={{textAlign: 'right', fontWeight: '700'}}>{m.full_name || m.username}</Text>
                <Text style={{color: COLORS.success, fontWeight: '700'}}>صلاحية كاملة للطلبات</Text>
              </View>
            ))}
          </View>
        )}
        {requestManagersTab === 'routes' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة مسارات الطلبات</Text>
            <Text style={styles.helper}>تحديد مسارات سير العمل والاعتمادات (مثل: السائق، المسؤول، الخدمات).</Text>
            <TextInput style={styles.input} placeholder="اسم المسار الجديد (مثل: الإدارة العليا)" value={newRouteName} onChangeText={setNewRouteName} textAlign="right" />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              if (newRouteName.trim()) {
                setWorkflowRoutes(prev => [...prev, newRouteName.trim()]);
                setNewRouteName('');
                Alert.alert('تم', 'تمت إضافة المسار بنجاح');
              }
            }}>
              <Text style={styles.btnText}>إضافة مسار جديد</Text>
            </TouchableOpacity>
            <View style={{marginTop: 15}}>
              {workflowRoutes.map((route, i) => (
                <View key={i} style={styles.inlineRow}>
                  <Text style={{flex: 1, textAlign: 'right', fontWeight: '700'}}>{route}</Text>
                  <TouchableOpacity onPress={() => setWorkflowRoutes(prev => prev.filter((_, index) => index !== i))}>
                    <Text style={styles.deleteText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderFleet = () => {
    const categories = ['السيارات المفعلة', 'السيارات الموقف', 'السيارات الخاصة', 'سيارات الشركة', 'جميع السيارات'];
    const filtered = fleet.filter(v => {
      const ownership = v.ownership || 'شركة';
      if (fleetCategory === 'السيارات المفعلة') return v.status !== 'موقف';
      if (fleetCategory === 'السيارات الموقف') return v.status === 'موقف';
      if (fleetCategory === 'السيارات الخاصة') return ownership === 'خاصة';
      if (fleetCategory === 'سيارات الشركة') return ownership === 'شركة';
      return true;
    });

    const openAddVehicle = () => {
      setVehicleEditId(null);
      setVehicleForm({
        id: '', carNumber: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
        payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة'
      });
      setVehicleModalVisible(true);
    };

    const openEditVehicle = (v: Vehicle) => {
      setVehicleEditId(v.id);
      setVehicleForm({ ...v, carNumber: v.carNumber, ownership: v.ownership || 'شركة' });
      setVehicleModalVisible(true);
    };

    const saveVehicle = async () => {
      if (!vehicleForm.carNumber.trim() || !vehicleForm.name.trim() || !vehicleForm.type.trim()) {
        Alert.alert('تنبيه', 'رقم السيارة واسم السيارة والنوع حقول مطلوبة.'); return;
      }
      const row = {
        car_number: vehicleForm.carNumber.trim(),
        car_name: vehicleForm.name.trim(),
        brand: vehicleForm.type.trim() || null,
        manufacturing_year: Number(vehicleForm.model) || null,
        model: vehicleForm.model.trim() || null,
        load_capacity: vehicleForm.payload.trim() || null,
        engine_number: vehicleForm.engineNo.trim() || null,
        chassis_number: vehicleForm.chassisNo.trim() || null,
        fuel_type: vehicleForm.fuelType || 'ديزل',
        ownership: vehicleForm.ownership || 'شركة',
        status: vehicleForm.status || 'في الخدمة'
      };
      try {
        let result: any;
        if (vehicleEditId) {
          result = await supabase.from('vehicles').update(row).eq('id', Number(vehicleEditId));
        } else {
          // vehicles.id is BIGINT without an automatic default in the current schema.
          const { data: lastRows, error: lastError } = await supabase
            .from('vehicles').select('id').order('id', { ascending: false }).limit(1);
          if (lastError) throw lastError;
          const nextId = Number(lastRows?.[0]?.id || 0) + 1;
          result = await supabase.from('vehicles').insert({ id: nextId, ...row });
        }
        if (result.error) throw result.error;
        setVehicleModalVisible(false);
        Alert.alert('تم الحفظ', 'تم حفظ بيانات السيارة في جدول vehicles.');
        await loadSupabaseData();
      } catch (e: any) { Alert.alert('تعذر حفظ السيارة', e?.message || 'تحقق من صلاحيات جدول vehicles.'); }
    };

    const deleteVehicle = (v: Vehicle) => {
      Alert.alert('تأكيد حذف السيارة', `هل تريد حذف السيارة رقم ${v.carNumber}؟ قد تمنع السجلات المرتبطة حذفها.`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase.from('vehicles').delete().eq('id', Number(v.id));
            if (error) throw error;
            Alert.alert('تم الحذف', 'حُذفت السيارة من قاعدة البيانات.');
            await loadSupabaseData();
          } catch (e: any) {
            Alert.alert('تعذر حذف السيارة', e?.message || 'قد توجد طلبات أو تعيينات مرتبطة بهذه السيارة.');
          }
        }}
      ]);
    };

    return (
      <View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.sectionTitle}>قائمة السيارات ({fleet.length})</Text>
          <TouchableOpacity style={styles.smallPrimary} onPress={openAddVehicle}><Text style={styles.btnText}>＋ إضافة سيارة</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
          {categories.map(c => (
            <TouchableOpacity key={c} style={[styles.choice, fleetCategory === c && styles.choiceActive]} onPress={() => setFleetCategory(c)}>
              <Text style={[styles.choiceText, fleetCategory === c && styles.choiceTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.importBtn} onPress={loadSupabaseData}>
          <Text style={styles.btnText}>🔄 مزامنة السيارات من السحابة</Text>
        </TouchableOpacity>
        {filtered.map(v => (
          <View key={v.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>🚗 {v.carNumber}</Text>
              <Text style={styles.badge}>{v.status}</Text>
            </View>
            <Text style={styles.cardTitle}>{v.name}</Text>
            <Text style={styles.cardText}>السائق: {v.driver}</Text>
            <Text style={styles.cardText}>الموديل: {v.model} | السعة: {v.payload}</Text>
            <Text style={styles.cardText}>الملكية: {v.ownership || 'شركة'} | الوقود: {v.fuelType || 'ديزل'}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => openEditVehicle(v)}>
                <Text style={styles.btnText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger }]} onPress={() => deleteVehicle(v)}>
                <Text style={styles.btnText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Modal visible={vehicleModalVisible} transparent animationType="slide" onRequestClose={() => setVehicleModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.modalCenter,{paddingBottom:36}]}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{vehicleEditId ? 'تعديل سيارة' : 'إضافة سيارة'}</Text>
                {[
                  ['carNumber','رقم السيارة (car_number)'], ['name','اسم السيارة'], ['type','الماركة / النوع'],
                  ['model','الموديل أو سنة الصنع'], ['payload','الحمولة / السعة'], ['engineNo','رقم المحرك'], ['chassisNo','رقم الشاسيه']
                ].map(([key,label]) => (
                  <View key={key}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput style={styles.input}
                      value={String((vehicleForm as any)[key] || '')}
                      onChangeText={v => setVehicleForm(p => ({ ...p, [key]: v }))}
                      textAlign="right"
                    />
                  </View>
                ))}
                <Text style={styles.label}>نوع الملكية</Text>
                <View style={styles.choiceRow}>
                  {['شركة', 'خاصة'].map(value => (
                    <TouchableOpacity key={value} style={[styles.choice, vehicleForm.ownership === value && styles.choiceActive]}
                      onPress={() => setVehicleForm(p => ({ ...p, ownership: value as any }))}>
                      <Text style={[styles.choiceText, vehicleForm.ownership === value && styles.choiceTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>الحالة</Text>
                <View style={styles.choiceRow}>
                  {['في الخدمة', 'موقف'].map(value => (
                    <TouchableOpacity key={value} style={[styles.choice, vehicleForm.status === value && styles.choiceActive]}
                      onPress={() => setVehicleForm(p => ({ ...p, status: value }))}>
                      <Text style={[styles.choiceText, vehicleForm.status === value && styles.choiceTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>نوع الوقود</Text>
                <View style={styles.choiceRow}>
                  {['ديزل', 'بترول'].map(value => (
                    <TouchableOpacity key={value} style={[styles.choice, vehicleForm.fuelType === value && styles.choiceActive]}
                      onPress={() => setVehicleForm(p => ({ ...p, fuelType: value }))}>
                      <Text style={[styles.choiceText, vehicleForm.fuelType === value && styles.choiceTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={saveVehicle}><Text style={styles.btnText}>حفظ السيارة</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVehicleModalVisible(false)}><Text style={styles.btnText}>إلغاء</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

  const renderDrivers = () => {
    const openAddDriver = () => {
      setDriverEditId(null);
      setDriverForm({ driver_name: '', plate_number: '', phone: '', status: 'active' });
      setDriverModalVisible(true);
    };

    const openEditDriver = (driver: any) => {
      setDriverEditId(Number(driver.id));
      setDriverForm({
        driver_name: String(driver.driver_name || ''),
        plate_number: String(driver.plate_number || ''),
        phone: String(driver.phone || ''),
        status: String(driver.status || 'active')
      });
      setDriverModalVisible(true);
    };

    const saveDriver = async () => {
      if (!driverForm.driver_name.trim()) {
        Alert.alert('بيانات ناقصة', 'أدخل اسم السائق قبل الحفظ.');
        return;
      }
      const row = {
        driver_name: driverForm.driver_name.trim(),
        plate_number: driverForm.plate_number.trim() || null,
        phone: driverForm.phone.trim() || null,
        status: driverForm.status || 'active'
      };
      try {
        setLoadingDb(true);
        const result = driverEditId
          ? await supabase.from('drivers').update(row).eq('id', driverEditId)
          : await supabase.from('drivers').insert(row);
        if (result.error) throw result.error;
        setDriverModalVisible(false);
        Alert.alert('تم الحفظ', 'تم حفظ بيانات السائق في جدول drivers.');
        await loadSupabaseData();
      } catch (e: any) {
        Alert.alert('تعذر حفظ السائق', e?.message || 'تحقق من صلاحيات جدول drivers.');
      } finally {
        setLoadingDb(false);
      }
    };

    const deleteDriver = (driver: any) => {
      Alert.alert('تأكيد حذف السائق', `هل تريد حذف السائق ${driver.driver_name}؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: async () => {
          try {
            setLoadingDb(true);
            const { error } = await supabase.from('drivers').delete().eq('id', Number(driver.id));
            if (error) throw error;
            Alert.alert('تم الحذف', 'حُذف السائق من قاعدة البيانات.');
            await loadSupabaseData();
          } catch (e: any) {
            Alert.alert('تعذر حذف السائق', e?.message || 'قد توجد طلبات مرتبطة بهذا السائق.');
          } finally {
            setLoadingDb(false);
          }
        }}
      ]);
    };

    return (
      <View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.sectionTitle}>السائقون ({drivers.length})</Text>
          <TouchableOpacity style={styles.smallPrimary} onPress={openAddDriver}>
            <Text style={styles.btnText}>＋ إضافة سائق</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helper}>تُقرأ البيانات وتُحفظ مباشرة في جدول drivers في Supabase.</Text>
        <TouchableOpacity style={styles.importBtn} onPress={loadSupabaseData}>
          <Text style={styles.btnText}>🔄 تحديث قائمة السائقين</Text>
        </TouchableOpacity>
        {drivers.map((driver: any) => (
          <View key={String(driver.id)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>👤 {driver.driver_name}</Text>
              <Text style={styles.badge}>{driver.status === 'active' ? 'نشط' : driver.status || 'غير محدد'}</Text>
            </View>
            <Text style={styles.cardText}>رقم السيارة: {driver.plate_number || 'غير مرتبط'}</Text>
            <Text style={styles.cardText}>الهاتف: {driver.phone || 'غير مسجل'}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748B' }]} onPress={() => openEditDriver(driver)}>
                <Text style={styles.btnText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger }]} onPress={() => deleteDriver(driver)}>
                <Text style={styles.btnText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <Modal visible={driverModalVisible} transparent animationType="slide" onRequestClose={() => setDriverModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.modalCenter, { paddingBottom: 36 }]}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{driverEditId ? 'تعديل بيانات سائق' : 'إضافة سائق جديد'}</Text>
                <Text style={styles.label}>اسم السائق *</Text>
                <TextInput style={styles.input} value={driverForm.driver_name}
                  onChangeText={value => setDriverForm(p => ({ ...p, driver_name: value }))}
                  textAlign="right" placeholder="اسم السائق" />
                <Text style={styles.label}>رقم السيارة (plate_number)</Text>
                <TextInput style={styles.input} value={driverForm.plate_number}
                  onChangeText={value => setDriverForm(p => ({ ...p, plate_number: value }))}
                  textAlign="right" keyboardType="default" placeholder="مثال: 22618" />
                <Text style={styles.label}>رقم الهاتف</Text>
                <TextInput style={styles.input} value={driverForm.phone}
                  onChangeText={value => setDriverForm(p => ({ ...p, phone: value }))}
                  textAlign="right" keyboardType="phone-pad" placeholder="رقم الهاتف" />
                <Text style={styles.label}>الحالة</Text>
                <View style={styles.choiceRow}>
                  {[['active', 'نشط'], ['inactive', 'غير نشط']].map(([value, label]) => (
                    <TouchableOpacity key={value} style={[styles.choice, driverForm.status === value && styles.choiceActive]}
                      onPress={() => setDriverForm(p => ({ ...p, status: value }))}>
                      <Text style={[styles.choiceText, driverForm.status === value && styles.choiceTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryBtn} disabled={loadingDb} onPress={saveDriver}>
                  <Text style={styles.btnText}>{loadingDb ? 'جارٍ الحفظ...' : 'حفظ السائق'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDriverModalVisible(false)}>
                  <Text style={styles.btnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

  const renderAssignments = () => {
    const filteredVehicles = fleet.filter(v => 
      !assignmentSearchCar || v.carNumber.includes(assignmentSearchCar) || v.name.includes(assignmentSearchCar)
    );
    const filteredDrivers = driverNames.filter(d => 
      !assignmentSearchDriver || d.includes(assignmentSearchDriver)
    );

    return (
      <View>
        <Text style={styles.sectionTitle}>ربط السائقين بالسيارات</Text>
        <Text style={styles.helper}>حدد السيارة (بالقائمة أو البحث)، السائق (بالقائمة أو البحث)، وتواريخ الربط.</Text>
        
        <Text style={styles.label}>اختر السيارة أو ابحث برقمها</Text>
        <View style={{flexDirection: 'row-reverse', gap: 8, marginBottom: 10}}>
          <TouchableOpacity style={[styles.dropdownInput, {flex: 1, marginBottom: 0}]} onPress={() => setVehicleDropdownVisible(true)}>
            <Text style={{textAlign:'right', color: assignmentForm.vehicleId ? COLORS.text : COLORS.muted}}>
              {assignmentForm.vehicleId ? `${assignmentForm.vehicleId} — ${assignmentVehicle?.name || ''}` : 'اختر من القائمة'}
            </Text>
          </TouchableOpacity>
          <TextInput 
            style={[styles.input, {flex: 1, marginBottom: 0}]} 
            placeholder="بحث برقم السيارة" 
            value={assignmentSearchCar}
            onChangeText={setAssignmentSearchCar}
            textAlign="right"
          />
        </View>

        <Text style={styles.label}>السائق</Text>
        <View style={{flexDirection: 'row-reverse', gap: 8, marginBottom: 10}}>
          <TouchableOpacity style={[styles.dropdownInput, {flex: 1, marginBottom: 0}]} onPress={() => setDriverDropdownVisible(true)}>
            <Text style={{textAlign: 'right', color: assignmentForm.driver ? COLORS.text : COLORS.muted}}>
              {assignmentForm.driver || 'اختر السائق'}
            </Text>
          </TouchableOpacity>
          <TextInput 
            style={[styles.input, {flex: 1, marginBottom: 0}]} 
            placeholder="بحث بالسائق" 
            value={assignmentSearchDriver}
            onChangeText={setAssignmentSearchDriver}
            textAlign="right"
          />
        </View>

        <Text style={styles.label}>تاريخ بداية الربط</Text>
        <TextInput 
          style={styles.input} 
          value={assignmentStartDate} 
          onChangeText={setAssignmentStartDate} 
          placeholder="YYYY-MM-DD" 
          textAlign="right" 
        />

        <Text style={styles.label}>تاريخ نهاية الربط (اختياري / مفتوح)</Text>
        <TextInput 
          style={styles.input} 
          value={assignmentEndDate} 
          onChangeText={setAssignmentEndDate} 
          placeholder="يترك فارغاً ليبقى الربط مفتوحاً" 
          textAlign="right" 
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
          if (!assignmentForm.vehicleId || !assignmentForm.driver) { Alert.alert('تنبيه', 'أكمل بيانات السيارة والسائق للربط.'); return; }
          const newAsg: Assignment = {
            id: `ASG-${Date.now()}`,
            driver: assignmentForm.driver,
            driverId: assignmentForm.driver,
            vehicleId: assignmentForm.vehicleId,
            startDate: assignmentStartDate,
            endDate: assignmentEndDate || 'مفتوح',
            notes: 'تم الربط بنجاح'
          };
          setAssignments(prev => [newAsg, ...prev]);
          Alert.alert('تم', 'تم حفظ عملية الربط بنجاح.');
        }}>
          <Text style={styles.btnText}>حفظ عملية الربط</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, {marginTop: 25, fontSize: 16}]}>سجل عمليات الربط السابقة</Text>
        {assignments.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد عمليات ربط مسجلة بعد.</Text></View>
        ) : (
          <View style={{backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginTop: 8}}>
            <View style={{flexDirection: 'row-reverse', backgroundColor: '#F1F5F9', padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border}}>
              <Text style={{flex: 2, fontWeight: '800', textAlign: 'right'}}>السيارة / السائق</Text>
              <Text style={{flex: 1.5, fontWeight: '800', textAlign: 'right'}}>تاريخ البداية</Text>
              <Text style={{flex: 1.5, fontWeight: '800', textAlign: 'right'}}>تاريخ النهاية</Text>
            </View>
            {assignments.map((asg) => (
              <View key={asg.id} style={{flexDirection: 'row-reverse', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', alignItems: 'center'}}>
                <Text style={{flex: 2, textAlign: 'right', fontSize: 13}}>{asg.vehicleId} - {asg.driver}</Text>
                <Text style={{flex: 1.5, textAlign: 'right', fontSize: 13}}>{asg.startDate}</Text>
                <Text style={{flex: 1.5, textAlign: 'right', fontSize: 13, color: asg.endDate === 'مفتوح' ? COLORS.success : COLORS.text}}>{asg.endDate}</Text>
              </View>
            ))}
          </View>
        )}

        <Modal visible={vehicleDropdownVisible} transparent animationType="fade" onRequestClose={() => setVehicleDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>اختيار السيارة</Text>
              <ScrollView style={{maxHeight:450}}>
                {filteredVehicles.map(v => (
                  <TouchableOpacity key={v.id} style={styles.driverOption} onPress={() => { setAssignmentForm(p => ({ ...p, vehicleId: v.carNumber })); setVehicleDropdownVisible(false); }}>
                    <Text style={styles.driverOptionText}>{v.carNumber} — {v.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVehicleDropdownVisible(false)}><Text style={styles.btnText}>إغلاق</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={driverDropdownVisible} transparent animationType="fade" onRequestClose={() => setDriverDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>اختيار السائق</Text>
              <ScrollView style={{ maxHeight: 450 }}>
                {filteredDrivers.map(name => (
                  <TouchableOpacity key={name} style={styles.driverOption}
                    onPress={() => { setAssignmentForm(p => ({ ...p, driver: name })); setDriverDropdownVisible(false); }}>
                    <Text style={styles.driverOptionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDriverDropdownVisible(false)}>
                <Text style={styles.btnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderPermissions = () => (
    <View>
      <Text style={styles.sectionTitle}>الصلاحيات</Text>
      {fleet.map(v => {
        const p = getPermission(v.carNumber);
        return (
          <View key={v.id} style={styles.card}>
            <Text style={styles.cardTitle}>{v.carNumber} - {v.driver}</Text>
            <View style={styles.switchRow}>
              <Switch value={!!p.requestService} onValueChange={value => setVehiclePermission(v.carNumber,'requestService',value)} />
              <Text style={styles.switchLabel}>طلبات الخدمات</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderMyRequestsAndReports = () => {
    const myRows = requests.filter(r => r.vehicleId === currentUser?.id || r.applicantId === currentUser?.authId);
    return (
      <View>
        <View style={{flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border}}>
          <TouchableOpacity onPress={() => setSubView('report')} style={[{flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: subView === 'report' ? COLORS.primary : 'transparent'}]}>
            <Text style={{fontWeight: '900', color: subView === 'report' ? COLORS.primary : COLORS.muted}}>سجل الطلبات</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSubView('create')} style={[{flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: subView === 'create' ? COLORS.primary : 'transparent'}]}>
            <Text style={{fontWeight: '900', color: subView === 'create' ? COLORS.primary : COLORS.muted}}>طلب جديد</Text>
          </TouchableOpacity>
        </View>

        {subView === 'create' ? (
          <View>
            <Text style={styles.sectionTitle}>الخدمات والطلبات</Text>
            {['وقود', 'زيوت', 'بطاريات', 'قطع غيار', 'صيانة', 'إطارات', 'إرسالية صيانة وخدمات'].map((type, index) => (
              <TouchableOpacity key={type} style={styles.serviceCard} onPress={() => openServiceRequest(type)}>
                <View style={styles.serviceIcon}><Text style={{fontSize:25}}>{['⛽','🛢️','🔋','🔧','🛠️','🛞','🧰'][index]}</Text></View>
                <View style={{flex:1}}><Text style={styles.serviceTitle}>{type === 'إرسالية صيانة وخدمات' ? 'طلب إرسالية صيانة وخدمات' : `طلب ${type}`}</Text><Text style={styles.serviceSub}>إنشاء طلب جديد وإرفاق المستندات</Text></View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>سجل وتقرير الطلبات</Text>
            {myRows.length === 0 ? (
              <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد طلبات مسجلة خاصة بك حالياً.</Text></View>
            ) : null}
            {myRows.map(r => {
              const isApproved = r.status === 'تمت الموافقة';
              const isRejected = r.status === 'مرفوض';
              return (
                <View key={r.id} style={[styles.card, {borderRightWidth: 5, borderRightColor: isApproved ? COLORS.success : isRejected ? COLORS.danger : COLORS.warning}]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardId}>طلب #{r.id}</Text>
                    <Text style={[styles.badge, {backgroundColor: isApproved ? '#E8F5E9' : isRejected ? '#FFEBEE' : '#FFF4E5', color: isApproved ? COLORS.success : isRejected ? COLORS.danger : '#9A5B00'}]}>{r.status}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{r.type}</Text>
                  <Text style={styles.cardText}>التاريخ: {r.date} | الكمية: {r.qty}</Text>
                  <Text style={styles.cardText}>التكلفة الإجمالية: {money(r.total)}</Text>
                  
                  {r.type === 'إرسالية صيانة' && isApproved && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB', marginTop: 8}]} onPress={() => handlePreviewPrintCarRepair(r)}>
                      <Text style={styles.btnText}>معاينة وطباعة النموذج</Text>
                    </TouchableOpacity>
                  )}
                  {r.type === 'إرسالية خدمات بنشر' && isApproved && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563EB', marginTop: 8}]} onPress={() => handlePreviewPrintPunctureService(r)}>
                      <Text style={styles.btnText}>معاينة وطباعة النموذج</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8}}>
                    <Text style={{textAlign: 'right', fontWeight: '800', color: COLORS.primary, fontSize: 13}}>مسار الاعتمادات الحالي:</Text>
                    <Text style={{textAlign: 'right', color: COLORS.text, fontSize: 12, marginTop: 2}}>المدير المباشر: {r.directManagerStatus || 'تحت المراجعة'}</Text>
                    <Text style={{textAlign: 'right', color: COLORS.text, fontSize: 12}}>الخدمات: {r.servicesStatus || 'تحت المراجعة'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderUserReportsSection = () => {
    const myRows = requests.filter(r => r.vehicleId === currentUser?.id || r.applicantId === currentUser?.authId);
    const reportCategories = [
      { key: 'وقود', label: 'تقرير المحروقات', icon: '⛽' },
      { key: 'زيوت', label: 'تقرير الزيوت', icon: '🛢️' },
      { key: 'قطع غيار', label: 'تقرير قطع الغيار', icon: '🔧' },
      { key: 'إطارات', label: 'تقارير الإطارات', icon: '🛞' },
      { key: 'صيانة', label: 'تقارير الصيانة', icon: '🛠️' },
      { key: 'بطاريات', label: 'تقارير البطاريات', icon: '🔋' },
      { key: 'رحلات', label: 'تقارير الرحلات', icon: '🧭' },
    ];

    const [selectedRepCat, setSelectedRepCat] = useState('وقود');
    const [repMode, setRepMode] = useState<'إجمالي' | 'تفصيلي'>('إجمالي');

    const filteredRows = myRows.filter(r => {
      if (selectedRepCat === 'رحلات') return r.type.includes('رحلة') || r.type.includes('مهمة');
      return r.type === selectedRepCat;
    });

    const totalCost = filteredRows.reduce((s, r) => s + Number(r.total || 0), 0);
    const totalQty = filteredRows.reduce((s, r) => s + Number(r.qty || 0), 0);

    return (
      <View>
        <Text style={styles.sectionTitle}>تقارير السيارة والأداء</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow} style={{marginBottom: 12}}>
          {reportCategories.map(cat => (
            <TouchableOpacity key={cat.key} onPress={() => setSelectedRepCat(cat.key)}
              style={[styles.choice, selectedRepCat === cat.key && styles.choiceActive]}>
              <Text style={[styles.choiceText, selectedRepCat === cat.key && styles.choiceTextActive]}>{cat.icon} {cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{flexDirection: 'row-reverse', gap: 10, marginBottom: 12}}>
          <TouchableOpacity onPress={() => setRepMode('إجمالي')} style={[styles.choice, repMode === 'إجمالي' && styles.choiceActive, {flex: 1, alignItems: 'center'}]}>
            <Text style={[styles.choiceText, repMode === 'إجمالي' && styles.choiceTextActive]}>إجمالي</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRepMode('تفصيلي')} style={[styles.choice, repMode === 'تفصيلي' && styles.choiceActive, {flex: 1, alignItems: 'center'}]}>
            <Text style={[styles.choiceText, repMode === 'تفصيلي' && styles.choiceTextActive]}>تفصيلي</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{selectedRepCat} - ({repMode})</Text>
          <Text style={styles.summaryValue}>{money(totalCost)}</Text>
          <Text style={styles.summarySub}>إجمالي الكميات: {totalQty} | عدد العمليات: {filteredRows.length}</Text>
        </View>

        {filteredRows.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد بيانات مطابقة لهذا التقرير.</Text></View>
        ) : null}

        {repMode === 'إجمالي' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ملخص الفترة الحالية</Text>
            <Text style={styles.cardText}>النوع: {selectedRepCat}</Text>
            <Text style={styles.cardText}>إجمالي التكلفة: {money(totalCost)}</Text>
            <Text style={styles.cardText}>إجمالي الكمية المسجلة: {totalQty}</Text>
          </View>
        ) : (
          filteredRows.map(r => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}><Text style={styles.cardId}>رقم العملية: {r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
              <Text style={styles.cardText}>التاريخ: {r.date}</Text>
              <Text style={styles.cardText}>الكمية أو المخصص: {r.qty}</Text>
              <Text style={styles.cardText}>الإجمالي/القيمة: {money(r.total)}</Text>
              {r.station ? <Text style={styles.cardText}>المحطة: {r.station}</Text> : null}
              {r.itemName ? <Text style={styles.cardText}>الصنف: {r.itemName}</Text> : null}
            </View>
          ))
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.success }]} onPress={() => exportExcel(filteredRows, `${selectedRepCat}-report`)}>
            <Text style={styles.btnText}>تصدير Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.primary }]} onPress={() => exportPdf(filteredRows, `تقرير ${selectedRepCat}`)}>
            <Text style={styles.btnText}>تصدير PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReports = (isAdmin = false) => {
    let rows = isAdmin ? requests : requests.filter(r => r.vehicleId === currentUser?.id || r.applicantId === currentUser?.authId);
    if (reportType !== 'الكل') rows = rows.filter(r => r.type === reportType);
    const total = rows.reduce((s,r) => s + Number(r.total || 0), 0);
    return (
      <View>
        <Text style={styles.sectionTitle}>{isAdmin ? 'التقارير الشاملة' : 'تقارير طلباتي'}</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي المصاريف والطلبات</Text>
          <Text style={styles.summaryValue}>{money(total)}</Text>
          <Text style={styles.summarySub}>{rows.length} عملية</Text>
        </View>
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
            <Text style={styles.cardTitle}>{r.type}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date} | الكمية: {r.qty}</Text>
            <Text style={styles.cardText}>التكلفة: {money(r.total)}</Text>
          </View>
        ))}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.success }]} onPress={() => exportExcel(rows, isAdmin ? 'admin-report' : 'my-report')}>
            <Text style={styles.btnText}>تصدير Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.primary }]} onPress={() => exportPdf(rows, isAdmin ? 'التقرير العام' : 'تقرير مصاريف السيارة')}>
            <Text style={styles.btnText}>تصدير PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUserSettings = () => {
    return (
      <View style={{backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden'}}>
        <View style={{backgroundColor: COLORS.primary, padding: 25, alignItems: 'center'}}>
          <Image source={{uri: currentUser?.profile?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}} style={{width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff', marginBottom: 10}} />
          <Text style={{color: '#fff', fontSize: 18, fontWeight: '900'}}>{currentUser?.name || currentUser?.username || 'ميثاق عبده علي مقبل'}</Text>
        </View>
        {[
          {title: 'الوضع الداكن', icon: '🌙', isSwitch: true},
          {title: 'بيانات الموظف', icon: '👤', action: () => Alert.alert('بيانات الموظف', `الاسم: ${currentUser?.name}\nالمستخدم: ${currentUser?.username}\nالدور: ${currentUser?.role}`)},
          {title: 'تغيير كلمة السر', icon: '🛡️', action: () => Alert.alert('تغيير كلمة السر', 'قريباً تفعيل ميزة تغيير كلمة المرور.')},
          {title: 'قد يهمك', icon: '🛍️', action: () => Alert.alert('قد يهمك', 'لا توجد إشعارات أو عروض جديدة حالياً.')},
          {title: 'تحديث التطبيق', icon: '🔄', action: () => Alert.alert('التحديث', `أنت تستخدم أحدث إصدار (${APP_VERSION})`)},
          {title: 'مشاركة التطبيق', icon: '📤', action: () => Alert.alert('مشاركة', 'تم نسخ رابط التطبيق للحافظة.')},
          {title: 'حول التطبيق', icon: 'ℹ️', action: () => Alert.alert('حول التطبيق', 'نظام إدارة الأسطول المتقدم - الإصدار ' + APP_VERSION)},
          {title: 'تسجيل الخروج', icon: '🚪', danger: true, action: handleLogout},
        ].map((item, idx) => (
          <TouchableOpacity key={idx} onPress={item.action} style={{flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'}}>
            <Text style={{fontSize: 20, marginLeft: 15}}>{item.icon}</Text>
            <Text style={{flex: 1, textAlign: 'right', fontSize: 16, fontWeight: '700', color: item.danger ? COLORS.danger : COLORS.text}}>{item.title}</Text>
            {item.isSwitch ? (
              <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{false: '#767577', true: COLORS.primary}} />
            ) : (
              <Text style={{color: COLORS.muted, fontSize: 18}}>‹</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRequestModal = () => {
    if (!serviceTypeModal && !maintenanceServiceSubModal) return null;

    if (maintenanceServiceSubModal) {
      return (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMaintenanceServiceSubModal(null)}>
          <SafeAreaView style={styles.requestModalScreen}>
            <View style={styles.requestModalHeader}>
              <Text style={styles.modalTitle}>طلب إرسالية صيانة وخدمات</Text>
              <TouchableOpacity onPress={() => setMaintenanceServiceSubModal(null)}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.requestFormScroll} contentContainerStyle={styles.requestFormContent}>
              <Text style={styles.sectionTitle}>اختر نوع الإرسالية:</Text>
              <TouchableOpacity style={styles.serviceCard} onPress={() => { setMaintenanceServiceSubModal(null); setServiceTypeModal('إرسالية صيانة'); }}>
                <View style={styles.serviceIcon}><Text style={{fontSize:22}}>🛠️</Text></View>
                <View style={{flex:1}}><Text style={styles.serviceTitle}>إرسالية صيانة</Text><Text style={styles.serviceSub}>طلب إصلاح سيارة وعطل فني</Text></View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceCard} onPress={() => { setMaintenanceServiceSubModal(null); setServiceTypeModal('إرسالية خدمات بنشر'); }}>
                <View style={styles.serviceIcon}><Text style={{fontSize:22}}>🛞</Text></View>
                <View style={{flex:1}}><Text style={styles.serviceTitle}>إرسالية خدمات بنشر</Text><Text style={styles.serviceSub}>طلب خدمات إطارات وبنشر</Text></View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      );
    }

    const price = currentUnitPrice();
    const qty = Number(reqQty) || 0;
    const prev = lastOdometer(currentUser?.id || '');

    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setServiceTypeModal(null); resetRequestForm(); }}>
        <SafeAreaView style={styles.requestModalScreen}>
          <View style={styles.requestModalHeader}><Text style={styles.modalTitle}>طلب {serviceTypeModal}</Text><TouchableOpacity onPress={() => { setServiceTypeModal(null); resetRequestForm(); }}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity></View>
          <ScrollView style={styles.requestFormScroll} contentContainerStyle={styles.requestFormContent} keyboardShouldPersistTaps="handled">
            <View style={styles.infoPill}><Text style={styles.infoPillText}>السيارة: {currentUser?.id}</Text><Text style={styles.infoPillText}>التاريخ: {TODAY()}</Text></View>
            
            {serviceTypeModal === 'وقود' && <>{renderSelect('المحطة', selectedStation, stations, setSelectedStation)}{renderSelect('نوع الوقود', selectedFuel, fuelTypes, setSelectedFuel)}</>}
            {serviceTypeModal === 'زيوت' && <>{renderSelect('نوع الزيت', selectedOil, oils, setSelectedOil)}<Text style={styles.label}>العداد السابق</Text><TextInput style={styles.readOnlyInput} value={String(prev)} editable={false} textAlign="right" /><Text style={styles.label}>العداد الحالي</Text><TextInput style={styles.input} keyboardType="numeric" value={currOdometer} onChangeText={setCurrOdometer} textAlign="right" /></>}
            {serviceTypeModal === 'بطاريات' && renderSelect('نوع البطارية', selectedBattery, batteries, setSelectedBattery)}
            {serviceTypeModal === 'قطع غيار' && renderSelect('قطعة الغيار', selectedPart, parts, setSelectedPart)}
            {serviceTypeModal === 'إطارات' && renderSelect('نوع الإطار', selectedTire, tires, setSelectedTire)}
            {serviceTypeModal === 'صيانة' && renderSelect('نوع الصيانة', selectedMaintenance, maintenanceItems, setSelectedMaintenance)}
            
            {serviceTypeModal === 'إرسالية صيانة' && (
              <>
                {renderSelect('الورشة', selectedWorkshop, workshops, setSelectedWorkshop)}
                {renderSelect('المهندس', selectedEngineer, engineers, setSelectedEngineer)}
                <Text style={styles.label}>سبب المشكلة / العطل</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={faultType} onChangeText={setFaultType} placeholder="اكتب وصف العطل هنا..." multiline textAlign="right" />
                <Text style={styles.label}>الإجراء المطلوب</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={requiredWork} onChangeText={setRequiredWork} placeholder="اكتب الإجراء المطلوب هنا..." multiline textAlign="right" />
              </>
            )}

            {serviceTypeModal === 'إرسالية خدمات بنشر' && (
              <>
                <Text style={styles.label}>التاريخ</Text>
                <TextInput style={styles.readOnlyInput} value={TODAY()} editable={false} textAlign="right" />
                {renderSelect('العميل', selectedClient, clients, setSelectedClient)}
                <Text style={styles.label}>الخدمة المطلوبة / نوع العطل</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={serviceDescription} onChangeText={setServiceDescription} placeholder="اكتب تفاصيل الخدمة المطلوبة..." multiline textAlign="right" />
                <Text style={styles.label}>ملاحظات</Text>
                <TextInput style={[styles.input,{minHeight:55}]} value={reqNotes} onChangeText={setReqNotes} placeholder="ملاحظات إضافية..." multiline textAlign="right" />
              </>
            )}

            {serviceTypeModal !== 'إرسالية صيانة' && serviceTypeModal !== 'إرسالية خدمات بنشر' && (
              <>
                <Text style={styles.label}>الكمية</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={reqQty} onChangeText={setReqQty} placeholder="أدخل الكمية" textAlign="right" />
                {price > 0 && <Text style={styles.totalText}>الإجمالي التقديري: {money(qty * price)}</Text>}
                <Text style={styles.label}>الملاحظات</Text>
                <TextInput style={[styles.input,{minHeight:75}]} value={reqNotes} onChangeText={setReqNotes} multiline textAlign="right" />
              </>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={openImagePicker}><Text style={styles.btnText}>📷 إرفاق صورة</Text></TouchableOpacity>
            {reqImage ? <View><Image source={{ uri: reqImage }} style={styles.previewImage} /></View> : null}
          </ScrollView>
          <View style={styles.requestFooter}><TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.primary}]} onPress={submitRequest}><Text style={styles.btnText}>إرسال الطلب</Text></TouchableOpacity></View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (showFourDotSplash) {
    return (
      <SafeAreaView style={styles.splashScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.splashDotsRow}>
          <View style={[styles.splashDot, { backgroundColor: '#C0272D' }]} />
          <View style={[styles.splashDot, { backgroundColor: '#FF7A45' }]} />
          <View style={[styles.splashDot, { backgroundColor: '#9E1F24' }]} />
          <View style={[styles.splashDot, { backgroundColor: '#F4A261' }]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>تسجيل الدخول</Text>
          <TextInput style={styles.input} placeholder="اسم المستخدم" placeholderTextColor="#94A3B8"
            value={username} onChangeText={setUsername} textAlign="right" />
          <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#94A3B8"
            secureTextEntry value={password} onChangeText={setPassword} textAlign="right" />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}><Text style={styles.btnText}>دخول</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    const adminNav = [
      ['requests', '📋', 'الطلبات'],
      ['coding', '🧩', 'التكويدات'],
      ['pricing', '💰', 'الأسعار'],
      ['fleet', '🚗', 'السيارات'],
      ['drivers', '👤', 'السائقون'],
      ['assignments', '🔗', 'الربط'],
      ['permissions', '🔐', 'الصلاحيات'],
      ['reports', '📊', 'التقارير'],
      ['settings', '⚙️', 'الإعدادات'],
      ...(isRequestApprover(currentUser)
        ? [['requestManagers', '👥', 'مسؤولي الطلبات']]
        : []),
    ];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topHeader}>
          <View><Text style={styles.headerTitle}>لوحة التحكم والإدارة</Text><Text style={styles.headerSub}>مرحبًا، {currentUser.name}</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adminNav} contentContainerStyle={{flexDirection:'row-reverse'}}>
          {adminNav.map(([key,icon,label]) => (
            <TouchableOpacity key={key} onPress={() => setAdminTab(key)}
              style={[styles.adminTab, adminTab === key && styles.adminTabActive]}>
              <Text style={styles.adminIcon}>{icon}</Text>
              <Text style={[styles.adminTabText, adminTab === key && styles.adminTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:110}}>
          {adminTab === 'requests' ? renderRequestsAdmin() : null}
          {adminTab === 'coding' ? renderCoding() : null}
          {adminTab === 'pricing' ? renderPricing() : null}
          {adminTab === 'fleet' ? renderFleet() : null}
          {adminTab === 'drivers' ? renderDrivers() : null}
          {adminTab === 'assignments' ? renderAssignments() : null}
          {adminTab === 'permissions' ? renderPermissions() : null}
          {adminTab === 'reports' ? renderReports(true) : null}
          {adminTab === 'settings' ? renderUserSettings() : null}
          {adminTab === 'requestManagers' && isRequestApprover(currentUser) ? renderRequestManagersAdmin() : null}
        </ScrollView>

        <Modal
          visible={managerAssignModal}
          transparent
          animationType="slide"
          onRequestClose={() => setManagerAssignModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                تعيين مسؤول للسيارة رقم {
                  selectedVehicleForAssign?.carNumber ??
                  selectedVehicleForAssign?.car_number ??
                  selectedVehicleForAssign?.id
                }
              </Text>

              <Text style={styles.label}>
                اختر المسؤول:
              </Text>

              <ScrollView style={{ maxHeight: 280 }}>
                {availableManagers.map((mgr: any) => (
                  <TouchableOpacity
                    key={mgr.id}
                    style={[
                      styles.mgrOption,
                      chosenDirectManager === mgr.id &&
                        styles.mgrOptionActive
                    ]}
                    onPress={() => setChosenDirectManager(mgr.id)}
                  >
                    <Text style={styles.mgrOptionText}>
                      {mgr.full_name} — {mgr.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.primaryBtnLarge}
                disabled={savingManager}
                onPress={saveAssignManager}
              >
                <Text style={styles.btnTextLarge}>
                  {savingManager ? 'جارٍ الحفظ...' : 'حفظ التعيين'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setManagerAssignModal(false)}
              >
                <Text style={styles.btnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={!!editingDispatchRequest}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingDispatchRequest(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>تعديل بيانات الإرسالية #{editingDispatchRequest?.id}</Text>
              <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight: '78%'}}>
                {editingDispatchRequest?.type === 'إرسالية صيانة' ? (
                  <>
                    <Text style={styles.label}>الورشة</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.workshop} onChangeText={value => setDispatchEditForm(prev => ({...prev, workshop: value}))} textAlign="right" />
                    <Text style={styles.label}>المهندس</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.engineer} onChangeText={value => setDispatchEditForm(prev => ({...prev, engineer: value}))} textAlign="right" />
                    <Text style={styles.label}>سبب المشكلة / العطل</Text>
                    <TextInput style={[styles.input,{minHeight:75}]} value={dispatchEditForm.faultType} onChangeText={value => setDispatchEditForm(prev => ({...prev, faultType: value}))} multiline textAlign="right" />
                    <Text style={styles.label}>الإجراء المطلوب</Text>
                    <TextInput style={[styles.input,{minHeight:75}]} value={dispatchEditForm.requiredWork} onChangeText={value => setDispatchEditForm(prev => ({...prev, requiredWork: value}))} multiline textAlign="right" />
                    <Text style={styles.label}>سبب العطل</Text>
                    <TextInput style={[styles.input,{minHeight:60}]} value={dispatchEditForm.faultCause} onChangeText={value => setDispatchEditForm(prev => ({...prev, faultCause: value}))} multiline textAlign="right" />
                    <Text style={styles.label}>قطع الغيار المستخدمة</Text>
                    <TextInput style={[styles.input,{minHeight:60}]} value={dispatchEditForm.spareParts} onChangeText={value => setDispatchEditForm(prev => ({...prev, spareParts: value}))} multiline textAlign="right" />
                    <Text style={styles.label}>التكلفة التقديرية</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.estimatedCost} onChangeText={value => setDispatchEditForm(prev => ({...prev, estimatedCost: value}))} keyboardType="decimal-pad" />
                    <Text style={styles.label}>التكلفة النهائية</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.finalCost} onChangeText={value => setDispatchEditForm(prev => ({...prev, finalCost: value}))} keyboardType="decimal-pad" />
                    <Text style={styles.label}>تقرير الورشة</Text>
                    <TextInput style={[styles.input,{minHeight:75}]} value={dispatchEditForm.workshopReport} onChangeText={value => setDispatchEditForm(prev => ({...prev, workshopReport: value}))} multiline textAlign="right" />
                    <Text style={styles.label}>حالة الاعتماد</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.approvalStatus} onChangeText={value => setDispatchEditForm(prev => ({...prev, approvalStatus: value}))} textAlign="right" />
                    <Text style={styles.label}>ملاحظات الاعتماد</Text>
                    <TextInput style={[styles.input,{minHeight:55}]} value={dispatchEditForm.approvalNotes} onChangeText={value => setDispatchEditForm(prev => ({...prev, approvalNotes: value}))} multiline textAlign="right" />
                    <Text style={styles.label}>حالة الإصلاح</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.repairStatus} onChangeText={value => setDispatchEditForm(prev => ({...prev, repairStatus: value}))} textAlign="right" />
                    <Text style={styles.label}>تاريخ إكمال الإصلاح (ISO أو تاريخ/وقت)</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.repairCompletedAt} onChangeText={value => setDispatchEditForm(prev => ({...prev, repairCompletedAt: value}))} placeholder="2026-10-25T12:00:00Z" />
                    <Text style={styles.label}>سُلّمت إلى</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.deliveredTo} onChangeText={value => setDispatchEditForm(prev => ({...prev, deliveredTo: value}))} textAlign="right" />
                    <Text style={styles.label}>تاريخ التسليم (ISO أو تاريخ/وقت)</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.deliveredAt} onChangeText={value => setDispatchEditForm(prev => ({...prev, deliveredAt: value}))} placeholder="2026-10-25T12:00:00Z" />
                    <Text style={styles.label}>ملاحظات التسليم</Text>
                    <TextInput style={[styles.input,{minHeight:55}]} value={dispatchEditForm.deliveryNotes} onChangeText={value => setDispatchEditForm(prev => ({...prev, deliveryNotes: value}))} multiline textAlign="right" />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>العميل</Text>
                    <TextInput style={styles.input} value={dispatchEditForm.client} onChangeText={value => setDispatchEditForm(prev => ({...prev, client: value}))} textAlign="right" />
                    <Text style={styles.label}>الخدمة المطلوبة / وصف الخدمة</Text>
                    <TextInput style={[styles.input,{minHeight:75}]} value={dispatchEditForm.serviceDescription} onChangeText={value => setDispatchEditForm(prev => ({...prev, serviceDescription: value}))} multiline textAlign="right" />
                  </>
                )}
                <Text style={styles.label}>ملاحظات</Text>
                <TextInput style={[styles.input,{minHeight:65}]} value={dispatchEditForm.notes} onChangeText={value => setDispatchEditForm(prev => ({...prev, notes: value}))} multiline textAlign="right" />
              </ScrollView>
              <TouchableOpacity style={styles.primaryBtnLarge} disabled={loadingDb} onPress={saveDispatchEdits}>
                <Text style={styles.btnTextLarge}>{loadingDb ? 'جارٍ الحفظ...' : 'حفظ التعديلات في قاعدة البيانات'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setEditingDispatchRequest(null)}>
                <Text style={styles.btnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={!!codingModal} transparent animationType="slide" onRequestClose={() => setCodingModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>تكويد {codingModal}</Text>
              <TextInput style={styles.input} value={newItem} onChangeText={setNewItem} placeholder="اسم العنصر" textAlign="right" />
              <TouchableOpacity style={styles.primaryBtn} onPress={saveCodingItem}><Text style={styles.btnText}>إضافة عنصر</Text></TouchableOpacity>
              <ScrollView style={{maxHeight:320}}>
                {codingModal ? codingMap[codingModal].map((item,index) => (
                  <View key={`${item}-${index}`} style={styles.inlineRow}>
                    <Text style={{flex:1,textAlign:'right'}}>{item}</Text>
                    <TouchableOpacity onPress={() => deleteCodingItem(codingModal,index)}><Text style={styles.deleteText}>حذف</Text></TouchableOpacity>
                  </View>
                )) : null}
              </ScrollView>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setCodingModal(null); setNewItem(''); }}><Text style={styles.btnText}>إغلاق</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const isManagerOrAdminUser = currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'direct_manager' || currentUser?.role === 'services_manager';
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topHeader}>
        <View><Text style={styles.headerTitle}>السيارة {currentUser.id}</Text><Text style={styles.headerSub}>{currentUser.driver}</Text></View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:110}}>
        {userTab === 'service' && renderMyRequestsAndReports()}
        {userTab === 'driver_requests' && isManagerOrAdminUser && renderRequestsAdmin()}
        {userTab === 'reports' ? renderUserReportsSection() : null}
        {userTab === 'settings' ? renderUserSettings() : null}
      </ScrollView>

      <View style={styles.driverNav}>
        {[
          ['service','🏠','الرئيسية'],
          ...(isManagerOrAdminUser ? [['driver_requests', '📋', 'طلبات السائقين']] : []),
          ['reports','📊','التقارير'],
          ['settings','⚙️','الإعدادات']
        ].map(([key,icon,label]) => (
          <TouchableOpacity key={key} style={styles.driverNavItem} onPress={() => setUserTab(key)}>
            <Text style={{fontSize:18}}>{icon}</Text>
            <Text style={[styles.driverNavText,userTab === key && styles.activeNavText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {renderRequestModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashScreen:{flex:1,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'},
  splashDotsRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},
  splashDot:{width:12,height:12,borderRadius:6},
  container:{flex:1,backgroundColor:COLORS.bg},
  loginContainer:{flex:1,backgroundColor:COLORS.bg,justifyContent:'center',alignItems:'center',padding:20},
  loginCard:{width:'100%',maxWidth:400,backgroundColor:'#fff',borderRadius:24,padding:26,elevation:5},
  loginTitle:{textAlign:'center',fontSize:22,fontWeight:'900',color:COLORS.primary,marginBottom:20},
  input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:12},
  primaryBtn:{backgroundColor:COLORS.primary,borderRadius:12,padding:13,alignItems:'center',marginTop:6},
  secondaryBtn:{backgroundColor:COLORS.primaryDark,borderRadius:12,padding:12,alignItems:'center',marginTop:10},
  btnText:{color:'#fff',fontWeight:'800',textAlign:'center'},
  topHeader:{backgroundColor:COLORS.primary,paddingHorizontal:18,paddingVertical:15,flexDirection:'row-reverse',alignItems:'center',gap:12},
  headerTitle:{color:'#fff',fontSize:19,fontWeight:'800',textAlign:'right'},
  headerSub:{color:'#FDE7E8',fontSize:13,textAlign:'right',marginTop:2},
  adminNav:{backgroundColor:'#fff',maxHeight:70,borderBottomWidth:1,borderBottomColor:COLORS.border},
  adminTab:{paddingHorizontal:12,paddingVertical:8,borderBottomWidth:3,borderBottomColor:'transparent',alignItems:'center',minWidth:82},
  adminTabActive:{borderBottomColor:COLORS.primary},
  adminTabText:{color:COLORS.muted,fontWeight:'700',fontSize:11,textAlign:'center'},
  adminTabTextActive:{color:COLORS.primary},
  adminIcon:{fontSize:18,marginBottom:2},
  content:{flex:1,padding:15},
  sectionTitle:{fontSize:20,fontWeight:'800',color:COLORS.text,textAlign:'right',marginBottom:8},
  helper:{textAlign:'right',color:COLORS.muted,fontSize:13,marginBottom:12},
  card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:11,borderWidth:1,borderColor:'#EEF2F7',elevation:1},
  cardHeader:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  cardId:{color:COLORS.primary,fontWeight:'800',fontSize:15},
  cardTitle:{textAlign:'right',fontWeight:'800',fontSize:16,color:COLORS.text,marginBottom:5},
  cardText:{textAlign:'right',color:'#475569',marginBottom:4},
  badge:{backgroundColor:'#FFF4E5',color:'#9A5B00',paddingHorizontal:9,paddingVertical:4,borderRadius:10,fontSize:12,fontWeight:'700'},
  actionRow:{flexDirection:'row-reverse',gap:8,marginTop:10},
  actionBtn:{flex:1,borderRadius:10,padding:11,alignItems:'center'},
  menuCard:{backgroundColor:'#fff',borderRadius:16,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7'},
  menuIcon:{width:46,height:46,borderRadius:14,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  menuIconText:{fontSize:22},
  menuTitle:{textAlign:'right',fontWeight:'800',fontSize:15,color:COLORS.text},
  menuSub:{textAlign:'right',fontSize:12,color:COLORS.muted,marginTop:3},
  chevron:{fontSize:30,color:COLORS.primary,fontWeight:'300'},
  field:{marginBottom:8},
  label:{textAlign:'right',fontWeight:'700',fontSize:13,color:'#475569',marginBottom:5,marginTop:4},
  choiceRow:{flexDirection:'row-reverse',gap:7,paddingVertical:2},
  choice:{borderWidth:1,borderColor:COLORS.border,borderRadius:10,paddingHorizontal:12,paddingVertical:8,backgroundColor:'#fff'},
  choiceActive:{backgroundColor:'#FFF0F1',borderColor:COLORS.primary},
  choiceText:{color:'#475569',fontSize:13},
  choiceTextActive:{color:COLORS.primary,fontWeight:'800'},
  priceRow:{backgroundColor:'#fff',borderRadius:12,padding:10,marginBottom:7,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},
  priceInput:{width:120,borderWidth:1,borderColor:COLORS.border,borderRadius:10,padding:9,textAlign:'right',backgroundColor:'#F8FAFC'},
  pageHeaderRow:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',marginBottom:8},
  smallPrimary:{backgroundColor:COLORS.primary,borderRadius:10,padding:9},
  importBtn:{backgroundColor:COLORS.primaryDark,borderRadius:12,padding:12,alignItems:'center',marginVertical:10},
  summaryCard:{backgroundColor:COLORS.primary,borderRadius:18,padding:18,marginBottom:12},
  summaryTitle:{color:'#FDE7E8',textAlign:'right',fontWeight:'700'},
  summaryValue:{color:'#fff',textAlign:'right',fontSize:26,fontWeight:'900',marginTop:5},
  summarySub:{color:'#FDE7E8',textAlign:'right',marginTop:3},
  exportBtn:{flex:1,borderRadius:10,padding:12,alignItems:'center'},
  switchRow:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:'#F1F5F9',paddingVertical:7},
  switchLabel:{flex:1,textAlign:'right',color:'#334155',marginRight:8},
  inlineRow:{flexDirection:'row-reverse',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#EEF2F7',gap:10},
  deleteText:{color:COLORS.danger,fontWeight:'800'},
  modalOverlay:{flex:1,backgroundColor:'rgba(15,23,42,.55)',justifyContent:'center'},
  modalCenter:{padding:16,justifyContent:'center'},
  modalContent:{backgroundColor:'#fff',borderRadius:20,padding:18,maxHeight:'92%'},
  modalTitle:{textAlign:'right',fontSize:20,fontWeight:'900',color:COLORS.text,marginBottom:12},
  infoPill:{flexDirection:'row-reverse',justifyContent:'space-between',backgroundColor:'#F8FAFC',borderRadius:10,padding:10,marginBottom:8},
  infoPillText:{color:COLORS.muted,fontSize:12,fontWeight:'700'},
  totalText:{color:COLORS.primary,fontSize:18,fontWeight:'900',textAlign:'right',marginVertical:8},
  previewImage:{width:110,height:110,borderRadius:12,alignSelf:'flex-end',marginVertical:8},
  serviceCard:{backgroundColor:'#fff',borderRadius:18,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7',elevation:1},
  serviceIcon:{width:55,height:55,borderRadius:17,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  serviceTitle:{textAlign:'right',fontWeight:'900',fontSize:16,color:COLORS.text},
  serviceSub:{textAlign:'right',color:COLORS.muted,fontSize:12,marginTop:3},
  driverNav:{flexDirection:'row-reverse',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.border,paddingVertical:7},
  driverNavItem:{flex:1,alignItems:'center',paddingVertical:7},
  driverNavText:{color:'#64748B',fontSize:11,fontWeight:'600'},
  activeNavText:{color:COLORS.primary,fontWeight:'900'},
  workflowTitle:{textAlign:'right',fontWeight:'800',color:COLORS.primary,marginTop:7},
  dropdownInput:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,padding:13,marginBottom:10},
  driverOption:{padding:14,borderBottomWidth:1,borderBottomColor:'#EEF2F7'},
  driverOptionText:{textAlign:'right',fontWeight:'700',color:COLORS.text},
  requestTabs:{backgroundColor:'#fff',borderRadius:12,marginBottom:12,borderWidth:1,borderColor:COLORS.border},
  requestTab:{paddingHorizontal:14,paddingVertical:11,borderBottomWidth:3,borderBottomColor:'transparent'},
  requestTabActive:{borderBottomColor:COLORS.primary,backgroundColor:'#FFF5F5'},
  requestTabText:{color:COLORS.muted,fontWeight:'700',fontSize:12},
  requestTabTextActive:{color:COLORS.primary,fontWeight:'900'},
  emptyCard:{backgroundColor:'#fff',borderRadius:16,padding:22,alignItems:'center',marginBottom:12},
  emptyText:{color:COLORS.muted,fontWeight:'700',textAlign: 'center'},
  requestImage:{width:170,height:170,borderRadius:14,alignSelf:'flex-end',marginTop:10},
  requestModalScreen:{flex:1,backgroundColor:COLORS.bg},
  requestModalHeader:{backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:12,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:COLORS.border},
  closeText:{color:COLORS.primary,fontWeight:'900',fontSize:14},
  requestFormScroll:{flex:1},
  requestFormContent:{padding:16,paddingBottom:30},
  requestFooter:{backgroundColor:'#fff',padding:10,borderTopWidth:1,borderTopColor:COLORS.border,flexDirection:'row-reverse'},
  readOnlyInput:{backgroundColor:'#E2E8F0',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
  adminAssignBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  adminAssignTitle: { fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 15, color: COLORS.text },
  assignRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  smallAssignBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallAssignText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  mgrOption: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, backgroundColor: '#F8FAFC' },
  mgrOptionActive: { backgroundColor: '#FFF0F1', borderColor: COLORS.primary },
  mgrOptionText: { textAlign: 'right', fontWeight: '700', color: COLORS.text },
  primaryBtnLarge: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  btnTextLarge: { color: '#fff', fontWeight: '900', fontSize: 16, textAlign: 'center' },
});
