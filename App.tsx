import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_API_URL = 'http://192.168.1.100:3000/api/sync';

type Role = 'user' | 'admin';

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  driverName: string;
  status: 'في الخدمة' | 'موقف';
}

interface ServiceRequest {
  id: string;
  type: 'وقود' | 'زيوت' | 'إطارات' | 'بطاريات' | 'صيانة وقطع غيار';
  processNumber: string;
  date: string;
  quantity: string;
  priceAmount?: string;
  allocation: string;
  station?: string;
  fuelType?: string;
  oilType?: string;
  prevOdometer?: string;
  currentOdometer?: string;
  distanceTraveled?: string;
  hasAttachment?: boolean;
  notes?: string;
  status: 'قيد المراجعة' | 'مرفوض' | 'تم الاعتماد';
  syncStatus: 'PENDING_PUSH' | 'SYNCED';
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
}

interface CodeCategories {
  spareParts: string[];
  oils: string[];
  allocations: string[];
  batteries: string[];
  stations: string[];
  tires: string[];
  fuelTypes: string[];
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('user');
  const [currentTab, setCurrentTab] = useState<string>('my_requests');

  const [myRequestsSubTab, setMyRequestsSubTab] = useState<string>('وقود');
  const [serviceSubTab, setServiceSubTab] = useState<string>('وقود');
  const [codingSubTab, setCodingSubTab] = useState<keyof CodeCategories | 'prices'>('prices');
  const [priceSubCategory, setPriceSubCategory] = useState<'fuel' | 'oil' | 'battery' | 'tire' | 'other'>('fuel');

  // إعدادات التقارير
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');
  const [reportType, setReportType] = useState<'detailed' | 'summary'>('detailed');

  const initialVehicles: Vehicle[] = [
    { id: 'v22618', plateNumber: '22618', name: 'قاطرة فولفو 2002رقم 22618', driverName: 'عبد الغني علي دحان', status: 'في الخدمة' },
    { id: 'v36040', plateNumber: '36040', name: 'شاحنة فولفو2013 رقم 36040', driverName: 'امين الســـيد', status: 'في الخدمة' },
    { id: 'v28336', plateNumber: '28336', name: 'متسوبيشي فوزو 2012رقم 28336', driverName: 'عماد علي دحان', status: 'في الخدمة' },
    { id: 'v31538', plateNumber: '31538', name: 'ايسوزو2016 رقم 31538', driverName: 'جميل قائد', status: 'في الخدمة' },
    { id: 'v29971', plateNumber: '29971', name: 'ايسوزو 2012رقم 29971', driverName: 'يزيدعبدالواسع', status: 'في الخدمة' },
    { id: 'v34552', plateNumber: '34552', name: 'ايسوزو 2015 رقم 34552', driverName: 'حافظ النيني', status: 'في الخدمة' },
    { id: 'v33230', plateNumber: '33230', name: 'بابور اسيوزا2016 رقم  33230', driverName: 'عبده محمد ناجي', status: 'في الخدمة' },
    { id: 'v34208', plateNumber: '34208', name: 'ايسوزو2020 رقم 34208', driverName: 'فهد سعيد سيف', status: 'في الخدمة' },
    { id: 'v28807', plateNumber: '28807', name: 'دينا متسوبيشي2012 رقم 28807', driverName: 'خالد عثمان', status: 'في الخدمة' },
    { id: 'v29485', plateNumber: '29485', name: 'دينا متسوبيشي2013 رقم 29485', driverName: 'درهم علي عبده', status: 'في الخدمة' },
    { id: 'v30646', plateNumber: '30646', name: 'دينا متسوبيشي 2014رقم 30646', driverName: 'محمدالنيني', status: 'في الخدمة' },
    { id: 'v36697', plateNumber: '36697', name: 'دينا متسوبيشي2013 رقم 36697', driverName: 'حمود سرحان', status: 'في الخدمة' }
  ];

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(initialVehicles);

  const [codes, setCodes] = useState<CodeCategories>({
    spareParts: ['فلاتر', 'سير محرك', 'قماشات فرامل'],
    oils: ['زيت محرك 20W50', 'زيت هيدروليك', 'زيت جير'],
    allocations: ['رحلة تعز - عدن', 'توزيع محلي', 'حركة مصنع'],
    batteries: ['بطارية 70 أمبير', 'بطارية 100 أمبير'],
    stations: ['محطة الزبيدي', 'محطة الشركة', 'محطة الأمل'],
    tires: ['إطار 22.5', 'إطار 16'],
    fuelTypes: ['ديزل', 'بنزين ممتاز', 'بنزين عادي']
  });

  const [itemPrices, setItemPrices] = useState<Record<string, string>>({
    'ديزل': '1000',
    'بنزين ممتاز': '1200',
    'زيت محرك 20W50': '5000'
  });

  const [newCodeInput, setNewCodeInput] = useState<string>('');
  const [priceItemSelect, setPriceItemSelect] = useState<string>('');
  const [priceValueInput, setPriceValueInput] = useState<string>('');

  const [userVehicle, setUserVehicle] = useState<Vehicle>(initialVehicles[0]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  // حقول طلب السائق
  const [reqProcessNo, setReqProcessNo] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPriceAmount, setReqPriceAmount] = useState('');
  const [reqAllocation, setReqAllocation] = useState('');
  const [reqStation, setReqStation] = useState('');
  const [reqFuelType, setReqFuelType] = useState('');
  const [reqOilType, setReqOilType] = useState('');
  const [reqPrevOdometer, setReqPrevOdometer] = useState('0');
  const [reqCurrentOdometer, setReqCurrentOdometer] = useState('');
  const [reqDistanceTraveled, setReqDistanceTraveled] = useState('0');
  const [reqAttachment, setReqAttachment] = useState<boolean>(false);
  const [reqNotes, setReqNotes] = useState('');

  const [userPassword, setUserPassword] = useState('000');

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      const savedRequests = await AsyncStorage.getItem('@fleet_requests');
      const savedVehicles = await AsyncStorage.getItem('@all_vehicles');
      const savedCodes = await AsyncStorage.getItem('@fleet_codes');
      const savedPrices = await AsyncStorage.getItem('@item_prices');

      if (savedRequests) setRequests(JSON.parse(savedRequests));
      if (savedVehicles) setAllVehicles(JSON.parse(savedVehicles));
      if (savedCodes) setCodes(JSON.parse(savedCodes));
      if (savedPrices) setItemPrices(JSON.parse(savedPrices));
    } catch (e) {
      console.log('خطأ قراءة البيانات', e);
    }
  };

  const saveRequestsLocally = async (newList: ServiceRequest[]) => {
    setRequests(newList);
    await AsyncStorage.setItem('@fleet_requests', JSON.stringify(newList));
  };

  const saveCodesLocally = async (newCodes: CodeCategories) => {
    setCodes(newCodes);
    await AsyncStorage.setItem('@fleet_codes', JSON.stringify(newCodes));
  };

  const savePricesLocally = async (newPrices: Record<string, string>) => {
    setItemPrices(newPrices);
    await AsyncStorage.setItem('@item_prices', JSON.stringify(newPrices));
  };

  const handleLogin = () => {
    if (!loginUsername) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم');
      return;
    }

    if (loginPassword !== '000' && loginPassword !== userPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة.');
      return;
    }

    if (loginUsername.trim().toLowerCase() === 'admin' || loginUsername.trim() === 'المسؤول') {
      setCurrentUserRole('admin');
      setIsLoggedIn(true);
      setCurrentTab('admin_dashboard');
      return;
    }

    const foundVehicle = allVehicles.find(v => v.plateNumber.trim() === loginUsername.trim());

    if (foundVehicle) {
      setUserVehicle(foundVehicle);
    } else {
      const tempVeh: Vehicle = {
        id: `v_${Date.now()}`,
        name: 'سيارة عامة',
        plateNumber: loginUsername,
        driverName: 'سائق عام',
        status: 'في الخدمة'
      };
      setUserVehicle(tempVeh);
    }

    setCurrentUserRole('user');
    setIsLoggedIn(true);
    setCurrentTab('my_requests');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const prepareOilRequest = (vehId: string) => {
    const oilReqs = requests.filter(r => r.vehicleId === vehId && r.type === 'زيوت' && r.currentOdometer);
    if (oilReqs.length > 0) {
      setReqPrevOdometer(oilReqs[0].currentOdometer || '0');
    } else {
      setReqPrevOdometer('0');
    }
    setReqProcessNo(`OIL-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const prepareFuelRequest = () => {
    setReqProcessNo(`FUEL-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handleOdometerChange = (currentOdo: string) => {
    setReqCurrentOdometer(currentOdo);
    const curr = parseFloat(currentOdo) || 0;
    const prev = parseFloat(reqPrevOdometer) || 0;
    if (curr >= prev) {
      setReqDistanceTraveled((curr - prev).toString());
    } else {
      setReqDistanceTraveled('0');
    }
  };

  const handleQuantityOrTypeChange = (qty: string, selectedType: string) => {
    setReqQuantity(qty);
    const unitPrice = itemPrices[selectedType];
    if (unitPrice && !isNaN(Number(qty)) && Number(qty) > 0) {
      const total = Number(qty) * Number(unitPrice);
      setReqPriceAmount(total.toString());
    }
  };

  const handleCreateRequest = (type: any) => {
    const todayDate = new Date().toISOString().split('T')[0];

    const newReq: ServiceRequest = {
      id: `APP-${Date.now()}`,
      type: type,
      processNumber: reqProcessNo || `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: todayDate,
      quantity: reqQuantity || '1',
      priceAmount: reqPriceAmount || '0',
      allocation: reqAllocation || codes.allocations[0] || 'عادي',
      station: reqStation || codes.stations[0],
      fuelType: reqFuelType || codes.fuelTypes[0],
      oilType: reqOilType || codes.oils[0],
      prevOdometer: reqPrevOdometer,
      currentOdometer: reqCurrentOdometer,
      distanceTraveled: reqDistanceTraveled,
      hasAttachment: reqAttachment,
      notes: reqNotes,
      status: 'قيد المراجعة',
      syncStatus: 'PENDING_PUSH',
      vehicleId: userVehicle.id,
      vehiclePlate: userVehicle.plateNumber,
      driverName: userVehicle.driverName
    };

    const updated = [newReq, ...requests];
    saveRequestsLocally(updated);

    Alert.alert('تم الإرسال', `تم إرسال طلب ${type} بنجاح برقم عملية (${newReq.processNumber}).`);
    setReqQuantity(''); setReqPriceAmount(''); setReqNotes(''); setReqAttachment(false); setReqCurrentOdometer('');
  };

  const handleApproveOrReject = (reqId: string, newStatus: 'تم الاعتماد' | 'مرفوض') => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: newStatus } : r);
    saveRequestsLocally(updated);
    Alert.alert('تم التحديث', `تم تعديل حالة الطلب إلى (${newStatus}).`);
  };

  const handleSavePrice = () => {
    if (!priceItemSelect || !priceValueInput) {
      Alert.alert('خطأ', 'يرجى اختيار الصنف وإدخال السعر');
      return;
    }
    const updatedPrices = { ...itemPrices, [priceItemSelect]: priceValueInput };
    savePricesLocally(updatedPrices);
    Alert.alert('تم', `تم حفظ سعر (${priceItemSelect}) بـ ${priceValueInput} ريال.`);
    setPriceValueInput('');
  };

  // فلترة تقارير السائق
  const getFilteredUserRequests = () => {
    return requests.filter(r => {
      const isMyVehicle = r.vehiclePlate === userVehicle.plateNumber;
      let inDateRange = true;
      if (reportFromDate && r.date < reportFromDate) inDateRange = false;
      if (reportToDate && r.date > reportToDate) inDateRange = false;
      return isMyVehicle && inDateRange;
    });
  };

  // حساب إجمالي التقارير
  const calculateUserSummary = () => {
    const filtered = getFilteredUserRequests();
    const summary: Record<string, { count: number; totalAmount: number; totalQty: number }> = {};

    filtered.forEach(r => {
      const amount = parseFloat(r.priceAmount || '0');
      const qty = parseFloat(r.quantity || '0');
      if (!summary[r.type]) {
        summary[r.type] = { count: 0, totalAmount: 0, totalQty: 0 };
      }
      summary[r.type].count += 1;
      summary[r.type].totalAmount += amount;
      summary[r.type].totalQty += qty;
    });

    return summary;
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.whiteLoginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.whiteLoginCard}>
          <Text style={styles.inputLabel}>اسم المستخدم:</Text>
          <TextInput
            style={styles.whiteInput}
            placeholder="أدخل رقم السيارة أو اسم المستخدم"
            value={loginUsername}
            onChangeText={setLoginUsername}
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>كلمة المرور:</Text>
          <TextInput
            style={styles.whiteInput}
            placeholder="أدخل كلمة المرور"
            secureTextEntry
            value={loginPassword}
            onChangeText={setLoginPassword}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleLogin}>
            <Text style={styles.whiteSubmitBtnText}>تسجيل الدخول 🔑</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* الشريط الترحيبي للرأس */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentUserRole === 'user' ? `🚗 السائق: ${userVehicle.driverName} | السيارة: (${userVehicle.plateNumber})` : 'أطلس - لوحة المسؤول'}
        </Text>
      </View>

      {/* شريط الأيقونات العلوي */}
      <View style={styles.topBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavScroll}>
          {currentUserRole === 'user' ? (
            <>
              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'my_requests' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('my_requests')}>
                <Text style={[styles.topNavText, currentTab === 'my_requests' && styles.activeTopNavText]}>📋 طلباتي</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'user_reports' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('user_reports')}>
                <Text style={[styles.topNavText, currentTab === 'user_reports' && styles.activeTopNavText]}>📊 التقارير</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'vehicle_info' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('vehicle_info')}>
                <Text style={[styles.topNavText, currentTab === 'vehicle_info' && styles.activeTopNavText]}>🚘 السيارة</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'request_service' && styles.activeTopNavBtn]} onPress={() => { setCurrentTab('request_service'); prepareFuelRequest(); }}>
                <Text style={[styles.topNavText, currentTab === 'request_service' && styles.activeTopNavText]}>🛠️ طلب خدمة</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'admin_dashboard' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('admin_dashboard')}>
                <Text style={[styles.topNavText, currentTab === 'admin_dashboard' && styles.activeTopNavText]}>📥 طلبات السائقين</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topNavBtn, currentTab === 'admin_coding' && styles.activeTopNavBtn]} onPress={() => setCurrentTab('admin_coding')}>
                <Text style={[styles.topNavText, currentTab === 'admin_coding' && styles.activeTopNavText]}>🏷️ التكويدات والأسعار</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.topNavBtn, { backgroundColor: '#FFEBEE' }]} onPress={handleLogout}>
            <Text style={[styles.topNavText, { color: '#D32F2F' }]}>🚪 خروج</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.contentContainer}>

        {/* --- شاشة تقارير السائق --- */}
        {currentTab === 'user_reports' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 تقارير مصروفات السيارة</Text>

            <View style={styles.subTabRow}>
              <TouchableOpacity style={[styles.chipBtn, reportType === 'detailed' && styles.activeChipBtn]} onPress={() => setReportType('detailed')}>
                <Text style={[styles.chipText, reportType === 'detailed' && styles.activeChipText]}>تقرير تفصيلي</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chipBtn, reportType === 'summary' && styles.activeChipBtn]} onPress={() => setReportType('summary')}>
                <Text style={[styles.chipText, reportType === 'summary' && styles.activeChipText]}>تقرير إجمالي</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>من تاريخ (YYYY-MM-DD):</Text>
            <TextInput style={styles.whiteInput} value={reportFromDate} onChangeText={setReportFromDate} placeholder="مثال: 2026-01-01" placeholderTextColor="#999" />

            <Text style={styles.inputLabel}>إلى تاريخ (YYYY-MM-DD):</Text>
            <TextInput style={styles.whiteInput} value={reportToDate} onChangeText={setReportToDate} placeholder="مثال: 2026-12-31" placeholderTextColor="#999" />

            {reportType === 'detailed' ? (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionTitle}>نتائج العمليات التفصيلية ({getFilteredUserRequests().length}):</Text>
                {getFilteredUserRequests().length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد عمليات مسجلة خلال هذه الفترة.</Text>
                ) : (
                  getFilteredUserRequests().map(req => (
                    <View key={req.id} style={styles.listItemRow}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.listItemTitle}>{req.type} - {req.processNumber}</Text>
                        <Text style={[styles.badge, req.status === 'تم الاعتماد' ? styles.badgeSuccess : req.status === 'مرفوض' ? styles.badgeDanger : styles.badgePending]}>{req.status}</Text>
                      </View>
                      <Text style={styles.listItemSub}>التاريخ: {req.date} | الكمية: {req.quantity}</Text>
                      <Text style={styles.listItemSub}>المبلغ الإجمالي: {req.priceAmount || '0'} ريال</Text>
                      {req.distanceTraveled ? <Text style={styles.listItemSub}>المسافة المقطوعة: {req.distanceTraveled} كم</Text> : null}
                    </View>
                  ))
                )}
              </View>
            ) : (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionTitle}>الملخص الإجمالي حسب نوع المصروفات:</Text>
                {Object.keys(calculateUserSummary()).length === 0 ? (
                  <Text style={styles.emptyText}>لا توجد بيانات إجمالية بالفترة المحددة.</Text>
                ) : (
                  Object.keys(calculateUserSummary()).map(typeKey => {
                    const item = calculateUserSummary()[typeKey];
                    return (
                      <View key={typeKey} style={styles.summaryCard}>
                        <Text style={styles.listItemTitle}>نوع المصروف: {typeKey}</Text>
                        <Text style={styles.listItemSub}>عدد العمليات: {item.count}</Text>
                        <Text style={styles.listItemSub}>إجمالي الكميات: {item.totalQty}</Text>
                        <Text style={[styles.listItemSub, { fontWeight: 'bold', color: '#2E7D32' }]}>إجمالي المبالغ: {item.totalAmount} ريال</Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {/* --- شاشة طلبات السائقين (حساب المسؤول) --- */}
        {currentTab === 'admin_dashboard' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📥 شاشة طلبات السائقين والمصروفات</Text>
            {requests.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات مقدمة من السائقين حتى الآن.</Text>
            ) : (
              requests.map((req) => (
                <View key={req.id} style={styles.requestAdminCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{req.type} - {req.processNumber}</Text>
                    <Text style={[styles.badge, req.status === 'تم الاعتماد' ? styles.badgeSuccess : req.status === 'مرفوض' ? styles.badgeDanger : styles.badgePending]}>
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.cardDetail}>السيارة: {req.vehiclePlate} | السائق: {req.driverName}</Text>
                  <Text style={styles.cardDetail}>التاريخ: {req.date} | الكمية: {req.quantity}</Text>
                  {req.priceAmount ? <Text style={styles.cardDetail}>المبلغ الإجمالي: {req.priceAmount} ريال</Text> : null}
                  {req.currentOdometer ? <Text style={styles.cardDetail}>العداد الحالي: {req.currentOdometer} (الفارق: {req.distanceTraveled} كم)</Text> : null}
                  {req.notes ? <Text style={styles.cardDetail}>ملاحظات: {req.notes}</Text> : null}
                  {req.hasAttachment ? <Text style={{ color: '#0D47A1', fontSize: 12, marginTop: 2 }}>📎 يحتوي على مرفق (صورة الفاتورة)</Text> : null}

                  {req.status === 'قيد المراجعة' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={[styles.approveBtn]} onPress={() => handleApproveOrReject(req.id, 'تم الاعتماد')}>
                        <Text style={styles.btnText}>اعتماد ✅</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rejectBtn]} onPress={() => handleApproveOrReject(req.id, 'مرفوض')}>
                        <Text style={styles.btnText}>رفض ❌</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* --- شاشة التكويدات والأسعار المرتبة --- */}
        {currentTab === 'admin_coding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إدارة الأسعار والتكويدات</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'prices' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('prices')}>
                <Text style={[styles.subTabText, codingSubTab === 'prices' && styles.activeSubTabText]}>💰 قيم الأسعار</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'stations' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('stations')}>
                <Text style={[styles.subTabText, codingSubTab === 'stations' && styles.activeSubTabText]}>⛽ المحطات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'fuelTypes' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('fuelTypes')}>
                <Text style={[styles.subTabText, codingSubTab === 'fuelTypes' && styles.activeSubTabText]}>🛢️ أنواع الوقود</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.subTabBtn, codingSubTab === 'oils' && styles.activeSubTabBtn]} onPress={() => setCodingSubTab('oils')}>
                <Text style={[styles.subTabText, codingSubTab === 'oils' && styles.activeSubTabText]}>💧 الزيوت</Text>
              </TouchableOpacity>
            </ScrollView>

            {codingSubTab === 'prices' ? (
              <View>
                <Text style={styles.sectionTitle}>تصنيف قيم الأسعار:</Text>
                <View style={styles.subTabRow}>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'fuel' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('fuel')}>
                    <Text style={[styles.chipText, priceSubCategory === 'fuel' && styles.activeChipText]}>أسعار الوقود (لتر)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'oil' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('oil')}>
                    <Text style={[styles.chipText, priceSubCategory === 'oil' && styles.activeChipText]}>أسعار الزيت</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'battery' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('battery')}>
                    <Text style={[styles.chipText, priceSubCategory === 'battery' && styles.activeChipText]}>البطاريات</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chipBtn, priceSubCategory === 'tire' && styles.activeChipBtn]} onPress={() => setPriceSubCategory('tire')}>
                    <Text style={[styles.chipText, priceSubCategory === 'tire' && styles.activeChipText]}>الإطارات</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>اختر الصنف لتحديد السعر:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {(priceSubCategory === 'fuel' ? codes.fuelTypes : priceSubCategory === 'oil' ? codes.oils : priceSubCategory === 'battery' ? codes.batteries : priceSubCategory === 'tire' ? codes.tires : codes.spareParts).map((itm) => (
                    <TouchableOpacity key={itm} style={[styles.chipBtn, priceItemSelect === itm && styles.activeChipBtn]} onPress={() => setPriceItemSelect(itm)}>
                      <Text style={[styles.chipText, priceItemSelect === itm && styles.activeChipText]}>{itm}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>السعر المحدد (ريال):</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={priceValueInput} onChangeText={setPriceValueInput} placeholder="أدخل السعر هنا..." placeholderTextColor="#999" />

                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={handleSavePrice}>
                  <Text style={styles.whiteSubmitBtnText}>حفظ السعر 💾</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>قائمة الأسعار الحالية المسجلة:</Text>
                {Object.keys(itemPrices).map((k) => (
                  <View key={k} style={styles.codeItemRow}>
                    <Text style={styles.codeItemText}>{k}: {itemPrices[k]} ريال</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>إضافة عنصر جديد:</Text>
                <TextInput style={styles.whiteInput} value={newCodeInput} onChangeText={setNewCodeInput} placeholder="اسم التكويد..." placeholderTextColor="#999" />
                <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => {
                  if (newCodeInput) {
                    const updated = [...codes[codingSubTab as keyof CodeCategories], newCodeInput];
                    saveCodesLocally({ ...codes, [codingSubTab]: updated });
                    setNewCodeInput('');
                  }
                }}>
                  <Text style={styles.whiteSubmitBtnText}>إضافة ➕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* --- شاشة طلب مصروف للسائق --- */}
        {currentTab === 'request_service' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إنشاء طلب مصروفات</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
              {['وقود', 'زيوت', 'إطارات', 'بطاريات', 'صيانة وقطع غيار'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.subTabBtn, serviceSubTab === t && styles.activeSubTabBtn]}
                  onPress={() => {
                    setServiceSubTab(t);
                    if (t === 'زيوت') prepareOilRequest(userVehicle.id);
                    if (t === 'وقود') prepareFuelRequest();
                  }}
                >
                  <Text style={[styles.subTabText, serviceSubTab === t && styles.activeSubTabText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>رقم العملية (تلقائي):</Text>
            <TextInput style={[styles.whiteInput, { backgroundColor: '#E0E0E0' }]} value={reqProcessNo} editable={false} />

            {/* طلب الوقود */}
            {serviceSubTab === 'وقود' && (
              <View>
                <Text style={styles.inputLabel}>نوع الوقود:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.fuelTypes.map((ft) => (
                    <TouchableOpacity key={ft} style={[styles.chipBtn, reqFuelType === ft && styles.activeChipBtn]} onPress={() => { setReqFuelType(ft); handleQuantityOrTypeChange(reqQuantity, ft); }}>
                      <Text style={[styles.chipText, reqFuelType === ft && styles.activeChipText]}>{ft}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>المحطة:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.stations.map((st) => (
                    <TouchableOpacity key={st} style={[styles.chipBtn, reqStation === st && styles.activeChipBtn]} onPress={() => setReqStation(st)}>
                      <Text style={[styles.chipText, reqStation === st && styles.activeChipText]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>الكمية (باللتر):</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={reqQuantity} onChangeText={(q) => handleQuantityOrTypeChange(q, reqFuelType)} placeholder="أدخل عدد اللترات" placeholderTextColor="#999" />

                <Text style={styles.inputLabel}>المخصص:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.allocations.map((alc) => (
                    <TouchableOpacity key={alc} style={[styles.chipBtn, reqAllocation === alc && styles.activeChipBtn]} onPress={() => setReqAllocation(alc)}>
                      <Text style={[styles.chipText, reqAllocation === alc && styles.activeChipText]}>{alc}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>المبلغ الإجمالي (تلقائي بالريال):</Text>
                <TextInput style={[styles.whiteInput, { backgroundColor: '#F0F4C3' }]} keyboardType="numeric" value={reqPriceAmount} onChangeText={setReqPriceAmount} />
              </View>
            )}

            {/* طلب الزيوت */}
            {serviceSubTab === 'زيوت' && (
              <View>
                <Text style={styles.inputLabel}>اختر نوع الزيت:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {codes.oils.map((o) => (
                    <TouchableOpacity key={o} style={[styles.chipBtn, reqOilType === o && styles.activeChipBtn]} onPress={() => setReqOilType(o)}>
                      <Text style={[styles.chipText, reqOilType === o && styles.activeChipText]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>الكمية:</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={reqQuantity} onChangeText={setReqQuantity} placeholder="عدد العلب" placeholderTextColor="#999" />

                <Text style={styles.inputLabel}>العداد السابق (تلقائي من آخر عملية):</Text>
                <TextInput style={[styles.whiteInput, { backgroundColor: '#E0E0E0' }]} value={reqPrevOdometer} editable={false} />

                <Text style={styles.inputLabel}>العداد الحالي:</Text>
                <TextInput style={styles.whiteInput} keyboardType="numeric" value={reqCurrentOdometer} onChangeText={handleOdometerChange} placeholder="أدخل قراءة العداد الحالية" placeholderTextColor="#999" />

                <Text style={styles.inputLabel}>المسافة المقطوعة (الفارق كم):</Text>
                <TextInput style={[styles.whiteInput, { backgroundColor: '#E8F5E9' }]} value={reqDistanceTraveled} editable={false} />
              </View>
            )}

            <Text style={styles.inputLabel}>ملاحظات:</Text>
            <TextInput style={styles.whiteInput} value={reqNotes} onChangeText={setReqNotes} placeholder="أي ملاحظات إضافية" placeholderTextColor="#999" />

            <TouchableOpacity style={[styles.attachBtn, reqAttachment && styles.activeAttachBtn]} onPress={() => setReqAttachment(!reqAttachment)}>
              <Text style={styles.attachBtnText}>{reqAttachment ? '✅ تم إرفاق صورة الفاتورة/العداد' : '📎 إرفاق صورة الفاتورة / العداد'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whiteSubmitBtn} onPress={() => handleCreateRequest(serviceSubTab)}>
              <Text style={styles.whiteSubmitBtnText}>إرسال الطلب 📤</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- طلباتي (حساب المستخدم) --- */}
        {currentTab === 'my_requests' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>سجل طلباتي المسجلة</Text>
            {requests.filter(r => r.vehiclePlate === userVehicle.plateNumber).length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات سابقة.</Text>
            ) : (
              requests.filter(r => r.vehiclePlate === userVehicle.plateNumber).map((req) => (
                <View key={req.id} style={styles.listItemRow}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.listItemTitle}>{req.type} ({req.processNumber})</Text>
                    <Text style={[styles.badge, req.status === 'تم الاعتماد' ? styles.badgeSuccess : req.status === 'مرفوض' ? styles.badgeDanger : styles.badgePending]}>
                      {req.status}
                    </Text>
                  </View>
                  <Text style={styles.listItemSub}>التاريخ: {req.date} | الكمية: {req.quantity}</Text>
                  {req.priceAmount ? <Text style={styles.listItemSub}>المبلغ: {req.priceAmount} ريال</Text> : null}
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  whiteLoginContainer: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 20 },
  whiteLoginCard: { width: '100%', maxWidth: 400, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 3, boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
  header: { backgroundColor: '#1565C0', padding: 15, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  topBarContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  topNavScroll: { flexDirection: 'row-reverse', paddingHorizontal: 10, paddingVertical: 8 },
  topNavBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4, backgroundColor: '#F0F2F5' },
  activeTopNavBtn: { backgroundColor: '#0D47A1' },
  topNavText: { fontSize: 13, color: '#424242', fontWeight: 'bold' },
  activeTopNavText: { color: '#FFFFFF' },
  contentContainer: { flex: 1, padding: 15 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, boxShadow: '0px 1px 4px rgba(0,0,0,0.08)' },
  requestAdminCard: { backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  summaryCard: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 8, borderRightWidth: 4, borderRightColor: '#2E7D32' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'right', marginTop: 12, marginBottom: 8 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  badgeSuccess: { backgroundColor: '#2E7D32' },
  badgeDanger: { backgroundColor: '#C62828' },
  badgePending: { backgroundColor: '#ED6C02' },
  cardDetail: { fontSize: 13, color: '#444', textAlign: 'right', marginBottom: 4 },
  subTabScroll: { flexDirection: 'row-reverse', marginBottom: 12 },
  subTabRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginBottom: 15 },
  subTabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#E0E0E0', marginHorizontal: 3 },
  activeSubTabBtn: { backgroundColor: '#1976D2' },
  subTabText: { fontSize: 12, color: '#333' },
  activeSubTabText: { color: '#FFF', fontWeight: 'bold' },
  inputLabel: { fontSize: 13, color: '#333', textAlign: 'right', marginTop: 8, marginBottom: 4, fontWeight: '600' },
  whiteInput: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 14, textAlign: 'right', marginBottom: 10, color: '#333' },
  whiteSubmitBtn: { backgroundColor: '#0D47A1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  whiteSubmitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 20, fontSize: 13 },
  codeItemRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  codeItemText: { fontSize: 13, color: '#333', textAlign: 'right' },
  pickerRow: { flexDirection: 'row-reverse', marginBottom: 10 },
  chipBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F0F0F0', marginHorizontal: 4, borderWidth: 1, borderColor: '#CCC' },
  activeChipBtn: { backgroundColor: '#0D47A1', borderColor: '#0D47A1' },
  chipText: { fontSize: 12, color: '#333' },
  activeChipText: { color: '#FFF', fontWeight: 'bold' },
  listItemRow: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, marginBottom: 8, borderRightWidth: 4, borderRightColor: '#1565C0' },
  listItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#0D47A1', textAlign: 'right' },
  listItemSub: { fontSize: 12, color: '#666', textAlign: 'right', marginTop: 2 },
  actionRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 },
  approveBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  rejectBtn: { backgroundColor: '#C62828', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  attachBtn: { backgroundColor: '#ECEFF1', padding: 10, borderRadius: 8, alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#CFD8DC' },
  activeAttachBtn: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  attachBtnText: { color: '#37474F', fontSize: 13, fontWeight: 'bold' }
});
