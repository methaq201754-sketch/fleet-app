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

// إعدادات الاتصال بـ Supabase باستخدام المفاتيح المقدمة
const SUPABASE_URL = 'https://j39WezKO1Io-ShqqoirCjA-f8Om0m0.supabase.co'; // (أو رابط مشروعك الفعلي)
const SUPABASE_ANON_KEY = 'sb_publishable_I2CFiA8TScMKgCGCHggV1g_8TCPQrEU';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_VERSION = '1.35.10';
const APP_BUILD = '45';

const COLORS = {
  primary: '#C0272D', primaryDark: '#9E1F24', accent: '#FF7A45',
  bg: '#F4F7FB', card: '#FFFFFF', text: '#263238', muted: '#718096',
  border: '#E2E8F0', success: '#2E7D32', warning: '#ED8B00', danger: '#C62828',
};

type Vehicle = {
  id: string; name: string; driver: string; status: string; type: string;
  model: string; payload: string; fuelType: string; engineNo: string; chassisNo: string;
  ownership?: 'شركة' | 'خاصة';
};

type RequestItem = {
  id: string; vehicleId: string; driver: string; type: string; date: string;
  qty: number; total: number; status: string; notes?: string; imageUri?: string;
  station?: string; fuelType?: string; unit?: string; oilType?: string;
  itemName?: string; prevOdo?: number; currOdo?: number; distance?: number;
  workshop?: string; engineer?: string; faultType?: string; requiredWork?: string;
  client?: string; serviceDescription?: string; workflow?: string; approvalTrail?: string[];
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

export default function App() {
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
  const [userTab, setUserTab] = useState('service');
  const [adminTab, setAdminTab] = useState('requests');
  const [notifications, setNotifications] = useState<{id:string;title:string;body:string;date:string;target:string}[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [tripType, setTripType] = useState('مهمة عمل');
  const [tripDestination, setTripDestination] = useState('');
  const [tripStart, setTripStart] = useState(TODAY());
  const [tripDuration, setTripDuration] = useState('1');
  const [tripReturn, setTripReturn] = useState('');
  const [tripCustody, setTripCustody] = useState('0');
  const [tripTypes, setTripTypes] = useState<string[]>(['مهمة عمل','توصيل مواد','مراجعة جهة']);
  const [tripDestinations, setTripDestinations] = useState<string[]>(['صنعاء','عدن','الحديدة','إب','ذمار','رداع']);
  const [tripRequests, setTripRequests] = useState<any[]>([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeTarget, setNoticeTarget] = useState('الكل');
  const [adminRequestTab, setAdminRequestTab] = useState('وقود');
  const [pricingCategoryModal, setPricingCategoryModal] = useState<string | null>(null);

  const [serviceTypeModal, setServiceTypeModal] = useState<string | null>(null);
  const [codingModal, setCodingModal] = useState<string | null>(null);
  const [itemEditor, setItemEditor] = useState({ index: -1, value: '' });
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
  const [newPassword, setNewPassword] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportType, setReportType] = useState('الكل');

  const [assignmentForm, setAssignmentForm] = useState<Assignment>({
    id: '', driver: '', driverId: '', vehicleId: '', startDate: TODAY(), endDate: '', notes: '',
  });
  const [driverDropdownVisible, setDriverDropdownVisible] = useState(false);
  const [vehicleDropdownVisible, setVehicleDropdownVisible] = useState(false);

  const [fleetCategory, setFleetCategory] = useState('جميع السيارات');
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleEditId, setVehicleEditId] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Vehicle>({
    id: '', name: '', driver: '', status: 'في الخدمة', type: '', model: '',
    payload: '', fuelType: 'ديزل', engineNo: '', chassisNo: '', ownership: 'شركة'
  });

  // جلب البيانات من Supabase عند بدء التشغيل
  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  const fetchDataFromSupabase = async () => {
    try {
      // جلب السيارات والسائقين من Supabase
      const { data: vehiclesData, error: vError } = await supabase.from('vehicles').select('*');
      const { data: driversData, error: dError } = await supabase.from('drivers').select('*');
      const { data: requestsData, error: rError } = await supabase.from('trip_requests').select('*');

      if (!vError && vehiclesData && !dError && driversData) {
        const mergedFleet: Vehicle[] = vehiclesData.map((v: any) => {
          const drv = driversData.find((d: any) => d.plate_number === v.plate_number);
          return {
            id: v.plate_number,
            name: `سيارة رقم ${v.plate_number}`,
            driver: drv ? drv.driver_name : 'غير محدد',
            status: v.status === 'available' ? 'في الخدمة' : 'موقف',
            type: v.vehicle_model || 'شاحنة/سيارة',
            model: '2020',
            payload: 'متوسطة',
            fuelType: 'ديزل',
            engineNo: 'ENG-' + v.plate_number,
            chassisNo: 'CHS-' + v.plate_number,
            ownership: 'شركة'
          };
        });
        setFleet(mergedFleet);
      }

      if (!rError && requestsData) {
        const formattedReqs = requestsData.map((r: any) => ({
          id: `REQ-${r.id}`,
          vehicleId: r.requester_username || '22618',
          driver: 'سائق الأسطول',
          type: 'وقود',
          date: r.created_at ? r.created_at.slice(0, 10) : TODAY(),
          qty: 1,
          total: 0,
          status: r.status === 'approved' ? 'تمت الموافقة' : 'تحت المراجعة',
          workflow: r.status === 'pending_supervisor' ? 'المسؤول المباشر (30551)' : r.status === 'pending_admin' ? 'ميثاق' : 'معتمد',
          notes: r.notes || ''
        }));
        setRequests(formattedReqs);
      }
    } catch (e) {
      console.log('خطأ في جلب البيانات من قاعدة البيانات:', e);
    }
  };

  const getPermission = (vehicleId: string): PermissionSet =>
    permissions[vehicleId] || DEFAULT_PERMISSIONS;

  const getNextRequestId = () => {
    const nums = requests.map(r => Number(String(r.id).replace(/\D/g, '')) || 0);
    return `REQ-${Math.max(1000, ...nums) + 1}`;
  };

  const lastOdometer = (vehicleId: string) => {
    const rows = requests.filter(r => r.vehicleId === vehicleId && r.type === 'زيوت' && r.currOdo != null);
    return rows.length ? Number(rows[rows.length - 1].currOdo) || 0 : 0;
  };

  const requestTypes = ['وقود', 'زيوت', 'بطاريات', 'قطع غيار', 'صيانة', 'إطارات', 'إرسالية صيانة', 'إرسالية بنشر وخدمات'];
  const [ownershipTypes, setOwnershipTypes] = useState<string[]>(['شركة','خاصة']);

  const codingMap: Record<string, string[]> = {
    'المحروقات': fuelTypes, 'الزيوت': oils, 'البطاريات': batteries, 'قطع الغيار': parts,
    'الإطارات': tires, 'المحطات': stations, 'الصيانة': maintenanceItems,
    'الورش': workshops, 'العملاء': clients, 'المهندسين': engineers, 'مالك السيارة': ownershipTypes, 'نوع المهمة': tripTypes, 'الوجهة/المنطقة': tripDestinations,
  };

  const codingSetters: Record<string, React.Dispatch<React.SetStateAction<string[]>>> = {
    'المحروقات': setFuelTypes, 'الزيوت': setOils, 'البطاريات': setBatteries,
    'قطع الغيار': setParts, 'الإطارات': setTires, 'المحطات': setStations,
    'الصيانة': setMaintenanceItems, 'الورش': setWorkshops, 'العملاء': setClients,
    'المهندسين': setEngineers, 'مالك السيارة': setOwnershipTypes, 'نوع المهمة': setTripTypes, 'الوجهة/المنطقة': setTripDestinations,
  };

  const driverNames = useMemo(
    () => Array.from(new Set(fleet.map(v => v.driver).filter(Boolean))),
    [fleet]
  );

  const assignmentVehicle = fleet.find(v => v.id === assignmentForm.vehicleId.trim());

  // تسجيل الدخول المرتبط بقاعدة بيانات Supabase (ميثاق = admin, 30551 = manager, وأرقام السيارات = drivers)
  const handleLogin = async () => {
    const u = username.trim(), p = password.trim();
    
    // حساب المسؤول العام ميثاق
    if (u === 'methaq' && p === '111') {
      setCurrentUser({ role: 'admin', name: 'ميثاق عبده علي مقبل بكر', id: 'methaq' });
      setUsername(''); setPassword(''); return;
    }

    try {
      // التحقق من الحساب في جدول profiles في Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', u)
        .single();

      if (error || !data) {
        Alert.alert('خطأ في الدخول', 'اسم المستخدم أو رقم السيارة غير موجود');
        return;
      }

      // كلمة المرور الافتراضية للجميع هي 000
      if (p === '000') {
        const foundVehicle = fleet.find(v => v.id === u) || { id: u, name: 'سيارة أسطول', driver: data.full_name, status: 'في الخدمة' };
        
        // التحقق مما إذا كان هو المسؤول المباشر (30551)
        if (data.role === 'manager' || u === '30551') {
          setCurrentUser({ role: 'manager', id: u, name: data.full_name, driver: data.full_name });
        } else {
          setCurrentUser({ role: 'driver', ...foundVehicle });
        }
        setEditDriverName(data.full_name);
        setUsername(''); setPassword('');
      } else {
        Alert.alert('خطأ', 'كلمة المرور غير صحيحة (كلمة المرور الافتراضية هي 000)');
      }
    } catch (e) {
      Alert.alert('خطأ اتصال', 'تعذر الاتصال بقاعدة بيانات Supabase');
    }
  };

  const handleLogout = () => {
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
  };

  const openServiceRequest = (type: string) => {
    resetRequestForm();
    setServiceTypeModal(type);
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

  // إرسال الطلب وحفظه في جدول trip_requests في Supabase
  const submitRequest = async () => {
    if (!currentUser || !serviceTypeModal) return;

    const newItemData = {
      requester_username: currentUser.id,
      start_location: 'المركز الرئيسي',
      destination: serviceTypeModal,
      status: 'pending_supervisor', // يبدأ بانتظار المسؤول المباشر (30551)
      notes: reqNotes || '',
    };

    try {
      const { error } = await supabase.from('trip_requests').insert([newItemData]);
      if (error) {
        Alert.alert('خطأ', 'فشل حفظ الطلب في قاعدة البيانات');
        return;
      }
      
      fetchDataFromSupabase(); // تحديث القائمة
      setServiceTypeModal(null);
      resetRequestForm();
      setUserTab('my_requests');
      Alert.alert('تم إرسال الطلب', 'تم إرسال الطلب بنجاح ليمر عبر مسار الموافقات (المسؤول المباشر 30551 ثم ميثاق).');
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال بقاعدة البيانات');
    }
  };

  // ترقية الطلب في مسار الموافقات (المسؤول المباشر 30551 ← ميثاق)
  const advanceRequestSupabase = async (reqId: string, currentStatus: string) => {
    let nextStatus = 'pending_admin';
    if (currentStatus === 'pending_admin' || currentUser.role === 'admin') {
      nextStatus = 'approved';
    }

    try {
      const idNum = reqId.replace('REQ-', '');
      await supabase.from('trip_requests').update({ status: nextStatus }).eq('id', idNum);
      fetchDataFromSupabase();
      Alert.alert('تم', 'تمت الموافقة على الطلب وتمريره للمرحلة التالية.');
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر تحديث حالة الطلب');
    }
  };

  const rejectRequestSupabase = async (reqId: string) => {
    try {
      const idNum = reqId.replace('REQ-', '');
      await supabase.from('trip_requests').update({ status: 'rejected' }).eq('id', idNum);
      fetchDataFromSupabase();
      Alert.alert('تم', 'تم رفض الطلب.');
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر رفض الطلب');
    }
  };

  const saveCodingItem = () => {
    if (!codingModal || !newItem.trim()) return;
    const setter = codingSetters[codingModal];
    if (!setter) return;
    setter(prev => {
      const copy = [...prev];
      if (itemEditor.index >= 0) copy[itemEditor.index] = newItem.trim();
      else copy.push(newItem.trim());
      return copy;
    });
    setNewItem(''); setItemEditor({ index: -1, value: '' });
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
    const header = 'الطلب,السيارة,السائق,النوع,التاريخ,الحالة,المرحلة\n';
    const body = rows.map(r =>
      [r.id, r.vehicleId, r.driver, r.type, r.date, r.status, r.workflow || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const uri = `${FileSystem.cacheDirectory}${filename}-${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(uri, header + body);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };

  const exportPdf = async (rows: RequestItem[], title: string) => {
    const html = `
      <html><body dir="rtl">
      <h2>${escapeHtml(title)}</h2>
      <table border="1" cellpadding="6" cellspacing="0" width="100%">
      <tr><th>الطلب</th><th>السيارة</th><th>النوع</th><th>التاريخ</th><th>الحالة</th><th>المرحلة</th></tr>
      ${rows.map(r => `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.vehicleId)}</td><td>${escapeHtml(r.type)}</td><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.status)}</td><td>${escapeHtml(r.workflow || '')}</td></tr>`).join('')}
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
          <View style={styles.menuIcon}><Text style={styles.menuIconText}>{['⛽','🛢️','🔋','🔧','🛞','🏪','🛠️','🏭','👥','👨‍🔧'][i]}</Text></View>
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
    return (
      <View>
        <Text style={styles.sectionTitle}>متابعة طلبات الأسطول (مسار الاعتماد)</Text>
        <Text style={styles.helper}>الطلبات تمر تباعاً من المسؤول المباشر (30551) ثم إلى المسؤول العام (ميثاق).</Text>
        {requests.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>لا توجد طلبات مسجلة حالياً في Supabase.</Text></View> : null}
        {requests.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardId}>{r.id}</Text><Text style={styles.badge}>{r.status}</Text></View>
            <Text style={styles.cardTitle}>طلب سيارة رقم: {r.vehicleId}</Text>
            <Text style={styles.cardText}>الخدمة / الوجهة: {r.type}</Text>
            <Text style={styles.cardText}>تاريخ الطلب: {r.date}</Text>
            {r.notes ? <Text style={styles.cardText}>ملاحظات: {r.notes}</Text> : null}
            <Text style={styles.workflowTitle}>المرحلة: {r.workflow}</Text>
            {r.status !== 'تمت الموافقة' && r.status !== 'رفض' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.success}]} onPress={() => advanceRequestSupabase(r.id, r.status)}><Text style={styles.btnText}>موافقة واعتماد</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.danger}]} onPress={() => rejectRequestSupabase(r.id)}><Text style={styles.btnText}>رفض الطلب</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderFleet = () => {
    return (
      <View>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.sectionTitle}>قائمة سيارات الأسطول ({fleet.length})</Text>
        </View>
        {fleet.map(v => (
          <View key={v.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>🚗 {v.id}</Text>
              <Text style={styles.badge}>{v.status}</Text>
            </View>
            <Text style={styles.cardTitle}>{v.name}</Text>
            <Text style={styles.cardText}>السائق المسؤول: {v.driver}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAssignments = () => (
    <View>
      <Text style={styles.sectionTitle}>ربط السائقين بالسيارات</Text>
      <Text style={styles.helper}>يتم ربط السائقين بالسيارات مباشرة عبر قاعدة بيانات Supabase.</Text>
      {fleet.map(v => (
        <View key={v.id} style={styles.card}>
          <Text style={styles.cardId}>السيارة: {v.id}</Text>
          <Text style={styles.cardText}>السائق الحالي: {v.driver}</Text>
        </View>
      ))}
    </View>
  );

  const renderPermissions = () => (
    <View>
      <Text style={styles.sectionTitle}>الصلاحيات وإدارة الحسابات</Text>
      <Text style={styles.helper}>حساب المسؤول العام (ميثاق) يمتلك الصلاحية الكاملة للتعديل والحذف وإضافة المسؤولين.</Text>
    </View>
  );

  const renderReports = (isAdmin = false) => {
    let rows = isAdmin ? requests : requests.filter(r => r.vehicleId === currentUser?.id);
    const total = rows.length;

    return (
      <View>
        <Text style={styles.sectionTitle}>{isAdmin ? 'التقارير العامة' : 'تقارير سيارتي'}</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>إجمالي الطلبات المسجلة</Text>
          <Text style={styles.summaryValue}>{total} طلب</Text>
        </View>
        {rows.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>{r.id}</Text>
              <Text style={styles.badge}>{r.status}</Text>
            </View>
            <Text style={styles.cardTitle}>النوع: {r.type}</Text>
            <Text style={styles.cardText}>التاريخ: {r.date}</Text>
            <Text style={styles.workflowTitle}>الحالة: {r.workflow}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRequestModal = () => {
    if (!serviceTypeModal) return null;
    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setServiceTypeModal(null); resetRequestForm(); }}>
        <SafeAreaView style={styles.requestModalScreen}>
          <View style={styles.requestModalHeader}><Text style={styles.modalTitle}>طلب {serviceTypeModal}</Text><TouchableOpacity onPress={() => { setServiceTypeModal(null); resetRequestForm(); }}><Text style={styles.closeText}>إغلاق</Text></TouchableOpacity></View>
          <ScrollView style={styles.requestFormScroll} contentContainerStyle={styles.requestFormContent}>
            <Text style={styles.label}>رقم السيارة</Text><TextInput style={styles.readOnlyInput} value={currentUser?.id || ''} editable={false} textAlign="right" />
            <Text style={styles.label}>السائق</Text><TextInput style={styles.readOnlyInput} value={currentUser?.driver || ''} editable={false} textAlign="right" />
            <Text style={styles.label}>ملاحظات أو تفاصيل الطلب</Text><TextInput style={[styles.input,{minHeight:90}]} value={reqNotes} onChangeText={setReqNotes} multiline textAlign="right" placeholder="اكتب تفاصيل الطلب..." />
          </ScrollView>
          <View style={styles.requestFooter}><TouchableOpacity style={[styles.actionBtn,{backgroundColor:COLORS.primary}]} onPress={submitRequest}><Text style={styles.btnText}>إرسال الطلب عبر Supabase</Text></TouchableOpacity></View>
        </SafeAreaView>
      </Modal>
    );
  };

  // شاشة تسجيل الدخول
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.loginSubtitle}>نظام إدارة الأسطول والسيارات</Text>
          <Text style={styles.helper}>دخول ميثاق: (methaq / 111)</Text>
          <Text style={styles.helper}>دخول المسؤول المباشر: (30551 / 000)</Text>
          <Text style={styles.helper}>دخول السائقين: (رقم السيارة / 000)</Text>
          <TextInput style={styles.input} placeholder="اسم المستخدم / رقم السيارة" placeholderTextColor="#94A3B8"
            value={username} onChangeText={setUsername} textAlign="right" />
          <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#94A3B8"
            secureTextEntry value={password} onChangeText={setPassword} textAlign="right" />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}><Text style={styles.btnText}>دخول للنظام</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // واجهة المسؤول العام (ميثاق) أو المسؤول المباشر (30551)
  if (currentUser.role === 'admin' || currentUser.role === 'manager') {
    const adminNav = [
      ['requests','📋','الطلبات'], ['fleet','🚗','السيارات'], ['assignments','🔗','الربط'],
      ['reports','📊','التقارير'],
    ];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerTitle}>{currentUser.role === 'admin' ? 'لوحة المسؤول العام (ميثاق)' : 'لوحة المسؤول المباشر'}</Text>
            <Text style={styles.headerSub}>مرحبًا، {currentUser.name || currentUser.driver}</Text>
          </View>
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

        <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:110}}>
          {adminTab === 'requests' ? renderRequestsAdmin() : null}
          {adminTab === 'fleet' ? renderFleet() : null}
          {adminTab === 'assignments' ? renderAssignments() : null}
          {adminTab === 'reports' ? renderReports(true) : null}
        </ScrollView>

        <TouchableOpacity style={styles.logoutBar} onPress={handleLogout}><Text style={styles.btnText}>تسجيل الخروج</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // واجهة السائق العادي
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>السيارة رقم: {currentUser.id}</Text>
          <Text style={styles.headerSub}>السائق: {currentUser.driver}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom:110}}>
        {userTab === 'service' && (
          <View>
            <Text style={styles.sectionTitle}>خدمات وطلبات الأسطول</Text>
            {requestTypes.map((type,index) => (
              <TouchableOpacity key={type} style={styles.serviceCard} onPress={() => openServiceRequest(type)}>
                <View style={styles.serviceIcon}><Text style={{fontSize:25}}>🚗</Text></View>
                <View style={{flex:1}}>
                  <Text style={styles.serviceTitle}>طلب {type}</Text>
                  <Text style={styles.serviceSub}>إرسال طلب جديد ليمر بمسار الموافقات</Text>
                </View>
                <Text style={styles.chevron}>‹</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.serviceCard} onPress={() => setUserTab('reports')}><View style={styles.serviceIcon}><Text style={{fontSize:24}}>📊</Text></View><View style={{flex:1}}><Text style={styles.serviceTitle}>طلباتي ومسارها</Text><Text style={styles.serviceSub}>متابعة حالة الطلبات المعتمدة والمعلقة</Text></View></TouchableOpacity>
          </View>
        )}

        {userTab === 'reports' ? renderReports(false) : null}
      </ScrollView>

      <View style={styles.driverNav}>
        {[
          ['service','🏠','الرئيسية'], ['reports','📊','طلباتي']
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
  container:{flex:1,backgroundColor:COLORS.bg},
  loginContainer:{flex:1,backgroundColor:COLORS.bg,justifyContent:'center',alignItems:'center',padding:20},
  loginCard:{width:'100%',maxWidth:400,backgroundColor:'#fff',borderRadius:24,padding:26,elevation:5},
  loginSubtitle:{textAlign:'center',fontSize:20,fontWeight:'800',color:COLORS.text,marginBottom:15},
  input:{backgroundColor:'#F8FAFC',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
  primaryBtn:{backgroundColor:COLORS.primary,borderRadius:12,padding:13,alignItems:'center',marginTop:6},
  secondaryBtn:{backgroundColor:COLORS.primaryDark,borderRadius:12,padding:12,alignItems:'center',marginTop:10},
  btnText:{color:'#fff',fontWeight:'800',textAlign:'center'},
  topHeader:{backgroundColor:COLORS.primary,paddingHorizontal:18,paddingVertical:15,flexDirection:'row-reverse',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:19,fontWeight:'800',textAlign:'right'},
  headerSub:{color:'#FDE7E8',fontSize:13,textAlign:'right',marginTop:2},
  adminNav:{backgroundColor:'#fff',maxHeight:70,borderBottomWidth:1,borderBottomColor:COLORS.border},
  adminTab:{paddingHorizontal:16,paddingVertical:10,borderBottomWidth:3,borderBottomColor:'transparent',alignItems:'center'},
  adminTabActive:{borderBottomColor:COLORS.primary},
  adminTabText:{color:COLORS.muted,fontWeight:'700',fontSize:12},
  adminTabTextActive:{color:COLORS.primary},
  adminIcon:{fontSize:18,marginBottom:2},
  content:{flex:1,padding:15},
  sectionTitle:{fontSize:20,fontWeight:'800',color:COLORS.text,textAlign:'right',marginBottom:8},
  helper:{textAlign:'right',color:COLORS.muted,fontSize:13,marginBottom:10},
  card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:11,borderWidth:1,borderColor:'#EEF2F7'},
  cardHeader:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  cardId:{color:COLORS.primary,fontWeight:'800',fontSize:15},
  cardTitle:{textAlign:'right',fontWeight:'800',fontSize:16,color:COLORS.text,marginBottom:5},
  cardText:{textAlign:'right',color:'#475569',marginBottom:4},
  badge:{backgroundColor:'#FFF4E5',color:'#9A5B00',paddingHorizontal:9,paddingVertical:4,borderRadius:10,fontSize:12,fontWeight:'700'},
  actionRow:{flexDirection:'row-reverse',gap:8,marginTop:10},
  actionBtn:{flex:1,borderRadius:10,padding:11,alignItems:'center'},
  logoutBar:{backgroundColor:'#7F1D1D',padding:13,alignItems:'center'},
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
  summaryCard:{backgroundColor:COLORS.primary,borderRadius:18,padding:18,marginBottom:12},
  summaryTitle:{color:'#FDE7E8',textAlign:'right',fontWeight:'700'},
  summaryValue:{color:'#fff',textAlign:'right',fontSize:26,fontWeight:'900',marginTop:5},
  serviceCard:{backgroundColor:'#fff',borderRadius:18,padding:14,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#EEF2F7'},
  serviceIcon:{width:55,height:55,borderRadius:17,backgroundColor:'#FFF1F1',alignItems:'center',justifyContent:'center'},
  serviceTitle:{textAlign:'right',fontWeight:'900',fontSize:16,color:COLORS.text},
  serviceSub:{textAlign:'right',color:COLORS.muted,fontSize:12,marginTop:3},
  driverNav:{flexDirection:'row-reverse',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.border,paddingVertical:7},
  driverNavItem:{flex:1,alignItems:'center',paddingVertical:7},
  driverNavText:{color:'#64748B',fontSize:11,fontWeight:'600'},
  activeNavText:{color:COLORS.primary,fontWeight:'900'},
  workflowTitle:{textAlign:'right',fontWeight:'800',color:COLORS.primary,marginTop:7},
  requestModalScreen:{flex:1,backgroundColor:COLORS.bg},
  requestModalHeader:{backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:12,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:COLORS.border},
  closeText:{color:COLORS.primary,fontWeight:'900',fontSize:14},
  requestFormScroll:{flex:1},
  requestFormContent:{padding:16,paddingBottom:30},
  requestFooter:{backgroundColor:'#fff',padding:10,borderTopWidth:1,borderTopColor:COLORS.border},
  readOnlyInput:{backgroundColor:'#E2E8F0',borderWidth:1,borderColor:COLORS.border,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:15,color:COLORS.text,marginBottom:10},
  emptyCard:{backgroundColor:'#fff',borderRadius:16,padding:22,alignItems:'center',marginBottom:12},
  emptyText:{color:COLORS.muted,fontWeight:'700',textAlign:'center'},
});
