
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert,
  Modal, SafeAreaView, StatusBar, Image, Switch, FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. إعدادات اتصال Supabase السحابي
// ==========================================
const SUPABASE_URL = 'https://mrxmiowlqmlktlerffkn.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_0oUqPI_Mll1sDTjxo-IRoA_KuMEl_wv';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const APP_VERSION = '1.32.9';
export const APP_BUILD = '42';

// ==========================================
// 2. ثوابت الألوان (مطابقة لتصميم الواجهات المرفقة)
// ==========================================
export const COLORS = {
  primary: '#D32F2F',      // أحمر رئيسي للتبويبات والأزرار العلوية
  primaryDark: '#9E1F24',  // أحمر غامق
  primaryLight: '#FFEBEE', // خلفية حمراء خفيفة للوسوم
  bg: '#F8FAFC',           // خلفية التطبيق الفاتحة
  card: '#FFFFFF',         // خلفية البطاقات والمدخلات
  text: '#1E293B',         // لون النصوص الرئيسي
  muted: '#64748B',        // لون النصوص الثانوية
  border: '#CBD5E1',       // أطر الحقول والبطاقات
  inputBg: '#F1F5F9',      // خلفية الحقول
  success: '#2E7D32',      // أخضر الاعتماد
  successBg: '#E8F5E9',    // خلفية المعتمد
  danger: '#D32F2F',       // أحمر الرفض
  warning: '#ED8B00',      // برتقالي معلق
};

// ==========================================
// 3. أنواع البيانات الكاملة (Types)
// ==========================================
export type Vehicle = {
  id: string;
  name: string;
  driver: string;
  status: string; // "في الخدمة", "موقف", "صيانة"
  type: string;
  model: string;
  payload: string;
  fuelType: string;
  engineNo: string;
  chassisNo: string;
  ownership?: 'شركة' | 'خاصة';
};

export type RequestItem = {
  id: string;
  vehicleId: string;
  driver: string;
  type: string; // "طلب وقود", "طلب صيانة", "طلب زيوت", "إطارات", "بطاريات", "قطع غيار"
  date: string;
  qty: number;
  total: number;
  status: string; // "تمت الموافقة", "تحت المراجعة", "مرفوض"
  approvalNumber: string;
  directManagerStatus: string;
  adminStatus: string;
  notes?: string;
  imageUri?: string;
  station?: string;
  fuelType?: string;
  unit?: string;
  oilType?: string;
  itemName?: string;
  prevOdo?: number;
  currOdo?: number;
  distance?: number;
  workshop?: string;
};

export type PermissionSet = {
  addVehicle: boolean;
  editVehicle: boolean;
  assignVehicle: boolean;
  changePassword: boolean;
  reports: boolean;
  requestService: boolean;
  fuel: boolean;
  oils: boolean;
  batteries: boolean;
  parts: boolean;
  maintenance: boolean;
  tires: boolean;
};

// ==========================================
// 4. البيانات الأولية الكاملة للأسطول والطلبات
// ==========================================
export const INITIAL_FLEET: Vehicle[] = [
  { id: '22618', name: 'قاطرة فولفو 2002 رقم 22618', driver: 'عبد الغني علي دحان', status: 'في الخدمة', type: 'شاحنة', model: '2002', payload: '40 طن', fuelType: 'ديزل', engineNo: 'ENG-22618', chassisNo: 'CHS-22618' },
  { id: '36040', name: 'شاحنة فولفو 2013 رقم 36040', driver: 'حافظ عبده محمد النينه', status: 'في الخدمة', type: 'شاحنة', model: '2013', payload: '35 طن', fuelType: 'ديزل', engineNo: 'ENG-36040', chassisNo: 'CHS-36040' },
  { id: '28336', name: 'متسوبيشي فوزو 2012 رقم 28336', driver: 'عبد الله احمد عبد الله', status: 'في الخدمة', type: 'دينا', model: '2012', payload: '7 طن', fuelType: 'ديزل', engineNo: 'ENG-28336', chassisNo: 'CHS-28336' },
  { id: '31538', name: 'دينا ايسوزو 2015 رقم 31538', driver: 'محمد علي عبده', status: 'في الخدمة', type: 'دينا', model: '2015', payload: '5 طن', fuelType: 'ديزل', engineNo: 'ENG-31538', chassisNo: 'CHS-31538' },
  { id: '34552', name: 'تويوتا هيلوكس 2019 رقم 34552', driver: 'سعيد احمد أحمد', status: 'في الخدمة', type: 'باص/بكم', model: '2019', payload: '2 طن', fuelType: 'بنزين', engineNo: 'ENG-34552', chassisNo: 'CHS-34552' },
  { id: '19820', name: 'قاطرة مرسيدس 1998 رقم 19820', driver: 'مختار عبده', status: 'في الخدمة', type: 'شاحنة', model: '1998', payload: '38 طن', fuelType: 'ديزل', engineNo: 'ENG-19820', chassisNo: 'CHS-19820' },
];

export const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: '103015',
    vehicleId: '22618',
    driver: 'عبد الغني علي دحان',
    type: 'طلب وقود',
    date: '2026-10-07',
    qty: 60,
    total: 72000,
    status: 'تمت الموافقة',
    approvalNumber: '103015',
    directManagerStatus: 'تمت الموافقة',
    adminStatus: 'تمت الموافقة',
    station: 'محطة الشركة',
    fuelType: 'ديزل',
    prevOdo: 120500,
    currOdo: 121100,
    distance: 600,
    notes: 'تعبئة خط سفر - خط الحديدة',
  },
  {
    id: '102956',
    vehicleId: '36040',
    driver: 'حافظ عبده محمد النينه',
    type: 'طلب زيوت',
    date: '2026-09-28',
    qty: 1,
    total: 25000,
    status: 'تمت الموافقة',
    approvalNumber: '102956',
    directManagerStatus: 'تمت الموافقة',
    adminStatus: 'تمت الموافقة',
    oilType: 'تويوتا الأصلي',
    notes: 'تغيير زيت دوري وحشوة زيت',
  },
  {
    id: '102800',
    vehicleId: '28336',
    driver: 'عبد الله احمد عبد الله',
    type: 'طلب صيانة',
    date: '2026-09-15',
    qty: 1,
    total: 45000,
    status: 'مرفوض',
    approvalNumber: '102800',
    directManagerStatus: 'مرفوض',
    adminStatus: 'مرفوض',
    workshop: 'ورشة المركز الرئيسي',
    notes: 'إصلاح فرامل وخراطة هوبات',
  }
];

const TODAY = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => `${Number(n || 0).toLocaleString()} ريال`;

// ==========================================
// 5. المكون الرئيسي والتطبيق (App Component)
// ==========================================
export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [fleet, setFleet] = useState<Vehicle[]>(INITIAL_FLEET);
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);

  const [currentScreen, setCurrentScreen] = useState<'requests' | 'fleet' | 'settings'>('requests');
  const [activeTab, setActiveTab] = useState<'request' | 'report'>('request');

  const [serviceCategory, setServiceCategory] = useState<'وقود' | 'صيانة' | 'زيوت'>('وقود');
  const [selectedVehicle, setSelectedVehicle] = useState('22618');
  const [requestDate, setRequestDate] = useState(TODAY());
  const [selectedStation, setSelectedStation] = useState('محطة الشركة');
  const [selectedFuelType, setSelectedFuelType] = useState('ديزل');
  const [quantity, setQuantity] = useState('');
  const [currOdoInput, setCurrOdoInput] = useState('');
  const [notes, setNotes] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | undefined>();

  const [statusFilter, setStatusFilter] = useState('كل الحالات');
  const [expandedCardId, setExpandedCardId] = useState<string | null>('103015');

  useEffect(() => {
    fetchRemoteRequests();
  }, []);

  const fetchRemoteRequests = async () => {
    try {
      const { data, error } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        const mapped: RequestItem[] = data.map((item: any) => ({
          id: item.id || String(Math.floor(Math.random() * 900000)),
          vehicleId: item.applicant_id || item.vehicle_id || '22618',
          driver: item.driver_name || 'سائق السيارات',
          type: item.type || item.title || 'طلب خدمة',
          date: item.created_at ? item.created_at.slice(0, 10) : TODAY(),
          qty: item.qty || 1,
          total: item.total || 0,
          status: item.status || 'تحت المراجعة',
          approvalNumber: item.id || '100000',
          directManagerStatus: item.status === 'موافق' || item.status === 'تمت الموافقة' ? 'تمت الموافقة' : 'تحت المراجعة',
          adminStatus: item.status === 'موافق' || item.status === 'تمت الموافقة' ? 'تمت الموافقة' : 'تحت المراجعة',
          notes: item.notes || '',
        }));
        setRequests(mapped);
      }
    } catch (e) {
      console.log('خطأ في جلب بيانات Supabase:', e);
    }
  };

  const handleLogin = () => {
    const u = username.trim();
    const p = password.trim();

    if (u === 'ميثاق' && p === '111') {
      setCurrentUser({ role: 'admin', name: 'ميثاق عبده علي مقبل' });
      setUsername('');
      setPassword('');
      return;
    }

    const found = fleet.find(v => v.id === u);
    if (found && p === '000') {
      if (found.status === 'موقف') {
        Alert.alert('الحساب موقوف', 'هذه السيارة موقوفة حالياً وممنوعة من تقديم الطلبات.');
        return;
      }
      setCurrentUser({ role: 'driver', ...found });
      setUsername('');
      setPassword('');
      return;
    }

    Alert.alert('خطأ في الدخول', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('الصلاحية مطلوبة', 'يرجى السماح بالتطبيق للوصول للصور.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) {
      setAttachedImage(result.assets[0].uri);
    }
  };

  const handleSubmitRequest = async () => {
    if (!quantity && serviceCategory === 'وقود') {
      Alert.alert('تنبيه', 'يرجى إدخال الكمية المطلوب تعبئتها');
      return;
    }

    const reqId = String(Math.floor(100000 + Math.random() * 900000));
    const newReq: RequestItem = {
      id: reqId,
      vehicleId: currentUser?.role === 'driver' ? currentUser.id : selectedVehicle,
      driver: currentUser?.name || 'سائق السيارات',
      type: `طلب ${serviceCategory}`,
      date: requestDate,
      qty: Number(quantity) || 1,
      total: (Number(quantity) || 1) * 1200,
      status: 'تحت المراجعة',
      approvalNumber: 'مُعلق',
      directManagerStatus: 'تحت المراجعة',
      adminStatus: 'تحت المراجعة',
      station: selectedStation,
      fuelType: selectedFuelType,
      currOdo: Number(currOdoInput) || 0,
      notes: notes || 'طلب جديد',
      imageUri: attachedImage,
    };

    try {
      await supabase.from('requests').insert([{
        id: reqId,
        title: `${newReq.type} - ${newReq.vehicleId}`,
        applicant_id: newReq.vehicleId,
        status: newReq.status,
        total: newReq.total,
        qty: newReq.qty,
        type: newReq.type
      }]);
    } catch (e) {
      console.log('خطأ في إرسال البيانات للخدمة السحابية:', e);
    }

    setRequests([newReq, ...requests]);
    Alert.alert('نجاح', 'تم إرسال طلب السيارة وحفظه بنجاح.');
    setQuantity('');
    setNotes('');
    setAttachedImage(undefined);
    setActiveTab('report');
  };

  const handleExportPdf = async () => {
    try {
      const rowsHtml = requests.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>${r.date}</td>
          <td>${r.vehicleId}</td>
          <td>${r.type}</td>
          <td>${r.qty}</td>
          <td>${money(r.total)}</td>
          <td>${r.status}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html dir="rtl">
          <head>
            <meta charset="utf-8"/>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; color: #D32F2F; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>تقرير طلبات أسطول السيارات</h1>
            <p>إجمالي تكلفة الطلبات: ${money(requests.reduce((sum, item) => sum + item.total, 0))}</p>
            <table>
              <tr>
                <th>رقم الطلب</th>
                <th>التاريخ</th>
                <th>السيارة</th>
                <th>نوع الخدمة</th>
                <th>الكمية</th>
                <th>التكلفة</th>
                <th>الحالة</th>
              </tr>
              ${rowsHtml}
            </table>
          </body>
        </html>
      `;

      const file = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'تصدير تقرير السيارات PDF' });
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر تصدير ملف PDF.');
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🚗</Text>
          </View>
          <Text style={styles.loginTitle}>نظام إدارة أسطول السيارات</Text>
          <Text style={styles.loginSubtitle}>تسجيل الدخول للنظام</Text>

          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم / رقم السيارة (مثال: ميثاق أو 22618)"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="كلمة المرور (111 للمسؤول / 000 للسائق)"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textAlign="right"
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
            <Text style={styles.btnText}>دخول للنظام</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderFleetRequestsScreen = () => {
    const filteredRequests = requests.filter(r => statusFilter === 'كل الحالات' || r.status === statusFilter);

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setCurrentUser(null)}>
            <Text style={styles.backArrow}>➔ خروج</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>إدارة السيارات والخدمات</Text>
          <TouchableOpacity onPress={handleExportPdf}>
            <Text style={{ fontSize: 18 }}>📄 PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'request' && styles.tabButtonActive]}
            onPress={() => setActiveTab('request')}
          >
            <Text style={[styles.tabText, activeTab === 'request' && styles.tabTextActive]}>طلب خدمة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'report' && styles.tabButtonActive]}
            onPress={() => setActiveTab('report')}
          >
            <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>تقرير الطلبات</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'request' ? (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.modeToggleCard}>
              <TouchableOpacity
                style={[styles.modeBtn, serviceCategory === 'وقود' && styles.modeBtnActive]}
                onPress={() => setServiceCategory('وقود')}
              >
                <Text style={styles.modeIcon}>⛽</Text>
                <Text style={[styles.modeBtnText, serviceCategory === 'وقود' && styles.modeBtnTextActive]}>وقود</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, serviceCategory === 'صيانة' && styles.modeBtnActive]}
                onPress={() => setServiceCategory('صيانة')}
              >
                <Text style={styles.modeIcon}>🛠️</Text>
                <Text style={[styles.modeBtnText, serviceCategory === 'صيانة' && styles.modeBtnTextActive]}>صيانة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, serviceCategory === 'زيوت' && styles.modeBtnActive]}
                onPress={() => setServiceCategory('زيوت')}
              >
                <Text style={styles.modeIcon}>🛢️</Text>
                <Text style={[styles.modeBtnText, serviceCategory === 'زيوت' && styles.modeBtnTextActive]}>زيوت</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowTwoFields}>
              <View style={styles.flexField}>
                <Text style={styles.floatingLabel}>تاريخ الطلب</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.iconInside}>📅</Text>
                  <TextInput
                    style={styles.inputText}
                    value={requestDate}
                    onChangeText={setRequestDate}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.flexField}>
                <Text style={styles.floatingLabel}>رقم السيارة</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.iconInside}>🚗</Text>
                  <TextInput
                    style={styles.inputText}
                    value={selectedVehicle}
                    onChangeText={setSelectedVehicle}
                    editable={currentUser?.role === 'admin'}
                    textAlign="right"
                  />
                </View>
              </View>
            </View>

            <View style={styles.singleField}>
              <Text style={styles.floatingLabel}>المحطة / الورشة المعتمدة</Text>
              <View style={styles.dropdownBox}>
                <Text style={styles.dropdownArrow}>▼</Text>
                <Text style={styles.dropdownSelectedText}>{selectedStation}</Text>
              </View>
            </View>

            <View style={styles.rowTwoFields}>
              <View style={styles.flexField}>
                <Text style={styles.floatingLabel}>قراءة العداد الحالي</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.iconInside}>🔢</Text>
                  <TextInput
                    style={styles.inputText}
                    placeholder="قراءة العداد..."
                    keyboardType="numeric"
                    value={currOdoInput}
                    onChangeText={setCurrOdoInput}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.flexField}>
                <Text style={styles.floatingLabel}>الكمية (لتر / عدد)</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.iconInside}>⛽</Text>
                  <TextInput
                    style={styles.inputText}
                    placeholder="أدخل الكمية..."
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                    textAlign="right"
                  />
                </View>
              </View>
            </View>

            <View style={styles.singleField}>
              <Text style={styles.floatingLabel}>ملاحظات وبيانات الخدمة</Text>
              <View style={[styles.inputBox, { height: 60, alignItems: 'flex-start', paddingTop: 10 }]}>
                <Text style={styles.iconInside}>📝</Text>
                <TextInput
                  style={[styles.inputText, { height: 40 }]}
                  placeholder="اكتب ملاحظات الطلب هنا..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.attachmentBox}>
              <View style={styles.attachmentHeader}>
                <Text style={styles.attachmentSub}>يمكنك إرفاق صورة العداد أو فاتورة الخدمة المتعلقة بالسيارة</Text>
                <View style={styles.attachBadge}>
                  <Text style={{ fontSize: 16 }}>📎</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
                <Text style={styles.attachBtnText}>{attachedImage ? '✓ تم إرفاق صورة' : '＋ إرفاق صورة / فاتورة'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRequest}>
              <Text style={styles.submitBtnText}>إرسال طلب الخدمة</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.filterCard}>
              <Text style={styles.floatingLabel}>فلترة بالحالة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: 8, paddingVertical: 4 }}>
                {['كل الحالات', 'تمت الموافقة', 'تحت المراجعة', 'مرفوض'].map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {filteredRequests.map(r => {
              const isApproved = r.status === 'تمت الموافقة';
              const isRejected = r.status === 'مرفوض';
              const isExpanded = expandedCardId === r.id;

              return (
                <View key={r.id} style={styles.reportCard}>
                  <TouchableOpacity
                    style={styles.cardTopRow}
                    onPress={() => setExpandedCardId(isExpanded ? null : r.id)}
                  >
                    <Text style={styles.arrowToggle}>{isExpanded ? '▲' : '▼'}</Text>
                    <View style={[styles.statusBadge, isApproved ? styles.statusSuccess : isRejected ? styles.statusDanger : styles.statusWarning]}>
                      <Text style={[styles.statusBadgeText, isApproved ? styles.textSuccess : isRejected ? styles.textDanger : styles.textWarning]}>
                        {r.status}
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.reportCategoryTitle}>{r.type} (سيارة: {r.vehicleId})</Text>
                      <Text style={styles.reportSubDetails}>السائق: {r.driver}</Text>
                    </View>
                    <View style={[styles.categoryCircle, isApproved ? styles.circleSuccess : styles.circleDanger]}>
                      <Text style={{ fontSize: 18 }}>🚗</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.cardDatesRow}>
                    <Text style={styles.dateRangeText}>التاريخ: {r.date}</Text>
                    <Text style={styles.dateRangeText}>الكمية: {r.qty} • التكلفة: {money(r.total)}</Text>
                  </View>

                  <Text style={styles.approvalNumText}>رقم الاعتماد: {r.approvalNumber} , _</Text>

                  {isExpanded && (
                    <View style={styles.approvalStepsBox}>
                      <View style={styles.stepRow}>
                        <Text style={[styles.stepStatus, isApproved && styles.textSuccess]}>{r.directManagerStatus}</Text>
                        <Text style={styles.stepName}>المدير المباشر</Text>
                        <Text style={styles.checkIcon}>✔</Text>
                      </View>
                      <View style={styles.stepRow}>
                        <Text style={[styles.stepStatus, isApproved && styles.textSuccess]}>{r.adminStatus}</Text>
                        <Text style={styles.stepName}>إدارة الخدمات والأسطول</Text>
                        <Text style={styles.checkIcon}>✔</Text>
                      </View>
                      {r.notes ? <Text style={{ textAlign: 'right', color: COLORS.muted, fontSize: 12, marginTop: 4 }}>ملاحظات: {r.notes}</Text> : null}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderFleetManagementScreen = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <View style={{ width: 24 }} />
        <Text style={styles.topBarTitle}>أسطول السيارات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {fleet.map(v => (
          <View key={v.id} style={styles.reportCard}>
            <Text style={{ fontSize: 16, fontWeight: '800', textAlign: 'right', color: COLORS.text }}>{v.name}</Text>
            <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'right', marginTop: 4 }}>السائق الحالي: {v.driver}</Text>
            <Text style={{ fontSize: 12, color: COLORS.primary, textAlign: 'right', marginTop: 2 }}>الحمولة: {v.payload} | الوقود: {v.fuelType}</Text>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '700' }}>الحالة: {v.status}</Text>
              <Text style={{ fontSize: 12, color: COLORS.muted }}>رقم الشاسية: {v.chassisNo}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderSettingsScreen = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <View style={{ width: 24 }} />
        <Text style={styles.topBarTitle}>الإعدادات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeaderBanner}>
          <View style={styles.avatarWrapper}>
            <Text style={{ fontSize: 32 }}>👨‍💼</Text>
          </View>
          <Text style={styles.profileNameText}>{currentUser?.name || 'ميثاق عبده علي مقبل'}</Text>
        </View>

        <View style={styles.settingsMenuList}>
          <View style={styles.settingMenuItem}>
            <Switch value={false} />
            <Text style={styles.settingMenuTitle}>الوضع الداكن</Text>
            <Text style={styles.settingMenuIcon}>🌙</Text>
          </View>

          <TouchableOpacity style={styles.settingMenuItem}>
            <Text style={styles.settingChevron}>‹</Text>
            <Text style={styles.settingMenuTitle}>بيانات الموظف والسيارات</Text>
            <Text style={styles.settingMenuIcon}>👤</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingMenuItem}>
            <Text style={styles.settingChevron}>‹</Text>
            <Text style={styles.settingMenuTitle}>تغيير كلمة السر</Text>
            <Text style={styles.settingMenuIcon}>🛡️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingMenuItem} onPress={fetchRemoteRequests}>
            <Text style={styles.settingChevron}>‹</Text>
            <Text style={styles.settingMenuTitle}>حالة المزامنة السحابية (Supabase)</Text>
            <Text style={styles.settingMenuIcon}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingMenuItem}>
            <Text style={styles.settingChevron}>‹</Text>
            <Text style={styles.settingMenuTitle}>حول التطبيق (v{APP_VERSION})</Text>
            <Text style={styles.settingMenuIcon}>ℹ️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingMenuItem} onPress={() => setCurrentUser(null)}>
            <Text style={styles.settingChevron}>‹</Text>
            <Text style={[styles.settingMenuTitle, { color: COLORS.danger }]}>تسجيل الخروج</Text>
            <Text style={[styles.settingMenuIcon, { color: COLORS.danger }]}>🚪</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={{ flex: 1 }}>
        {currentScreen === 'requests' && renderFleetRequestsScreen()}
        {currentScreen === 'fleet' && renderFleetManagementScreen()}
        {currentScreen === 'settings' && renderSettingsScreen()}
      </View>

      <View style={styles.bottomNavBar}>
        <TouchableOpacity style={styles.bottomNavItem} onPress={() => setCurrentScreen('settings')}>
          <Text style={[styles.bottomNavIcon, currentScreen === 'settings' && styles.bottomNavIconActive]}>⚙️</Text>
          <Text style={[styles.bottomNavLabel, currentScreen === 'settings' && styles.bottomNavLabelActive]}>الإعدادات</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomNavItem} onPress={() => setCurrentScreen('fleet')}>
          <Text style={[styles.bottomNavIcon, currentScreen === 'fleet' && styles.bottomNavIconActive]}>🚚</Text>
          <Text style={[styles.bottomNavLabel, currentScreen === 'fleet' && styles.bottomNavLabelActive]}>الأسطول</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomNavItem} onPress={() => setCurrentScreen('requests')}>
          <Text style={[styles.bottomNavIcon, currentScreen === 'requests' && styles.bottomNavIconActive]}>🏠</Text>
          <Text style={[styles.bottomNavLabel, currentScreen === 'requests' && styles.bottomNavLabelActive]}>الرئيسية</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomNavItem}>
          <Text style={styles.bottomNavIcon}>🔔</Text>
          <Text style={styles.bottomNavLabel}>إشعارات</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomNavItem}>
          <View style={styles.brandIconBadge}><Text style={styles.brandBadgeText}>YCPD</Text></View>
          <Text style={styles.bottomNavLabel}>عنّا</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loginContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 24, padding: 26, elevation: 4 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#FFF', fontSize: 34, fontWeight: '800' },
  loginTitle: { textAlign: 'center', fontSize: 22, fontWeight: '800', color: COLORS.text },
  loginSubtitle: { textAlign: 'center', fontSize: 14, color: COLORS.muted, marginBottom: 20, marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text, marginBottom: 12 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  topBar: {
    height: 56, backgroundColor: '#FFFFFF', flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  backArrow: { fontSize: 14, color: COLORS.primary, fontWeight: '800' },
  tabContainer: {
    flexDirection: 'row-reverse', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 16, fontWeight: '700', color: COLORS.muted },
  tabTextActive: { color: COLORS.primary, fontWeight: '900' },
  formContainer: { flex: 1, padding: 16 },
  modeToggleCard: {
    flexDirection: 'row-reverse', borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 16, padding: 4, marginBottom: 16, backgroundColor: '#FFFFFF'
  },
  modeBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeIcon: { fontSize: 16 },
  modeBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  modeBtnTextActive: { color: '#FFFFFF' },
  rowTwoFields: { flexDirection: 'row-reverse', gap: 12, marginBottom: 14 },
  flexField: { flex: 1 },
  singleField: { marginBottom: 14 },
  floatingLabel: { textAlign: 'right', fontSize: 13, fontWeight: '700', color: COLORS.muted, marginBottom: 4 },
  inputBox: {
    flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: COLORS.inputBg,
  },
  iconInside: { fontSize: 16, color: COLORS.muted, marginLeft: 8 },
  inputText: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600' },
  dropdownBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 14, height: 50, backgroundColor: '#FFFFFF'
  },
  dropdownArrow: { fontSize: 14, color: COLORS.muted },
  dropdownSelectedText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  attachmentBox: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 16, padding: 16, marginTop: 6, marginBottom: 16
  },
  attachmentHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  attachmentSub: { fontSize: 12, color: COLORS.muted, flex: 1, textAlign: 'right', marginRight: 8 },
  attachBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  attachButton: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  attachBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 30 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  filterCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  filterChipTextActive: { color: '#FFFFFF' },
  reportCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  arrowToggle: { fontSize: 12, color: COLORS.muted },
  categoryCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  circleSuccess: { backgroundColor: COLORS.successBg },
  circleDanger: { backgroundColor: COLORS.primaryLight },
  reportCategoryTitle: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  reportSubDetails: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusSuccess: { backgroundColor: COLORS.successBg },
  statusDanger: { backgroundColor: COLORS.primaryLight },
  statusWarning: { backgroundColor: '#FFF3E0' },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  textSuccess: { color: COLORS.success },
  textDanger: { color: COLORS.danger },
  textWarning: { color: COLORS.warning },
  cardDatesRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  dateRangeText: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  approvalNumText: { textAlign: 'center', color: COLORS.success, fontWeight: '800', marginTop: 8, fontSize: 13 },
  approvalStepsBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  stepName: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'right', marginRight: 8 },
  stepStatus: { fontSize: 12, fontWeight: '800' },
  checkIcon: { fontSize: 14, color: COLORS.success, fontWeight: '900' },
  profileHeaderBanner: { backgroundColor: COLORS.primary, height: 160, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
  avatarWrapper: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  profileNameText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  settingsMenuList: { backgroundColor: '#FFFFFF', flex: 1 },
  settingMenuItem: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  settingMenuIcon: { fontSize: 20, marginLeft: 14 },
  settingMenuTitle: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '800', color: COLORS.text },
  settingChevron: { fontSize: 22, color: COLORS.muted },
  bottomNavBar: {
    height: 60, backgroundColor: '#FFFFFF', flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#E2E8F0'
  },
  bottomNavItem: { alignItems: 'center', justifyContent: 'center' },
  bottomNavIcon: { fontSize: 20, color: COLORS.muted },
  bottomNavIconActive: { color: COLORS.primary },
  bottomNavLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '700', marginTop: 2 },
  bottomNavLabelActive: { color: COLORS.primary, fontWeight: '900' },
  brandIconBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.text, alignItems: 'center', justifyContent: 'center' },
  brandBadgeText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900' },
});
