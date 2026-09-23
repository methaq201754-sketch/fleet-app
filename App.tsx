import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

type Role = 'Admin' | 'Driver';
type RequestType = 'محروقات' | 'زيوت' | 'قطع غيار' | 'صيانة';
type RequestStatus = 'قيد الانتظار' | 'تمت الموافقة' | 'مرفوض';

interface User {
  username: string;
  password: string;
  role: Role;
  carNumber: string;
  driverName: string;
}

interface PriceConfig {
  fuelPricePerLiter: number;
  oilPricePerLiter: number;
}

interface ServiceRequest {
  id: string;
  driverUsername: string;
  driverName: string;
  carNumber: string;
  type: RequestType;
  stationName?: string;
  quantityLiters?: number;
  unitPrice?: number;
  totalCost: number;
  details?: string;
  odometerReading?: number;
  imageUri?: string;
  dateTime: string;
  status: RequestStatus;
}

const INITIAL_USERS: User[] = [
  { username: 'ميثاق', password: '111', role: 'Admin', carNumber: 'إدارة', driverName: 'ميثاق (المدير)' },
  { username: '22618', password: '000', role: 'Driver', carNumber: 'ط - 1024', driverName: 'سائق 22618' },
  { username: '36040', password: '000', role: 'Driver', carNumber: 'ط - 2055', driverName: 'سائق 36040' },
  { username: '31710', password: '000', role: 'Driver', carNumber: 'ط - 3012', driverName: 'سائق 31710' },
  { username: '30551', password: '000', role: 'Driver', carNumber: 'ط - 4088', driverName: 'سائق 30551' },
  { username: '46166', password: '000', role: 'Driver', carNumber: 'ط - 5019', driverName: 'سائق 46166' },
];

const DEFAULT_PRICES: PriceConfig = {
  fuelPricePerLiter: 950,
  oilPricePerLiter: 3500,
};

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [prices, setPrices] = useState<PriceConfig>(DEFAULT_PRICES);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [currentTab, setCurrentTab] = useState<'requests' | 'inquiries' | 'change_pass' | 'admin_panel'>('requests');
  const [selectedReqType, setSelectedReqType] = useState<RequestType>('محروقات');

  const [fuelQuantity, setFuelQuantity] = useState('');
  const [stationName, setStationName] = useState('');
  const [odometer, setOdometer] = useState('');
  const [reqDetails, setReqDetails] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [estimatedCostInput, setEstimatedCostInput] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [adminTab, setAdminTab] = useState<'manage_requests' | 'pricing' | 'cars'>('manage_requests');
  const [fuelPriceInput, setFuelPriceInput] = useState('');
  const [oilPriceInput, setOilPriceInput] = useState('');

  const [newDriverUser, setNewDriverUser] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newCarNo, setNewCarNo] = useState('');

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('@fleet_users');
      const storedPrices = await AsyncStorage.getItem('@fleet_prices');
      const storedReqs = await AsyncStorage.getItem('@fleet_requests');

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedPrices) setPrices(JSON.parse(storedPrices));
      if (storedReqs) setRequests(JSON.parse(storedReqs));
    } catch (e) {
      console.error(e);
    }
  };

  const saveData = async (updatedUsers?: User[], updatedPrices?: PriceConfig, updatedReqs?: ServiceRequest[]) => {
    if (updatedUsers) {
      setUsers(updatedUsers);
      await AsyncStorage.setItem('@fleet_users', JSON.stringify(updatedUsers));
    }
    if (updatedPrices) {
      setPrices(updatedPrices);
      await AsyncStorage.setItem('@fleet_prices', JSON.stringify(updatedPrices));
    }
    if (updatedReqs) {
      setRequests(updatedReqs);
      await AsyncStorage.setItem('@fleet_requests', JSON.stringify(updatedReqs));
    }
  };

  const handleLogin = () => {
    const user = users.find(
      (u) => u.username.trim() === loginUsername.trim() && u.password.trim() === loginPassword.trim()
    );

    if (user) {
      setCurrentUser(user);
      setLoginUsername('');
      setLoginPassword('');
      if (user.role === 'Admin') setCurrentTab('admin_panel');
      else setCurrentTab('requests');
    } else {
      Alert.alert('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setAttachmentUri(result.assets[0].uri);
    }
  };

  const handleSendRequest = () => {
    if (!currentUser) return;

    let total = 0;
    let unitPrice = 0;
    const qty = parseFloat(fuelQuantity) || 0;

    if (selectedReqType === 'محروقات') {
      if (!qty || qty <= 0) {
        Alert.alert('تنبيه', 'يرجى إدخال كمية المحروقات باللتر');
        return;
      }
      unitPrice = prices.fuelPricePerLiter;
      total = qty * unitPrice;
    } else {
      total = parseFloat(estimatedCostInput) || 0;
    }

    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      driverUsername: currentUser.username,
      driverName: currentUser.driverName,
      carNumber: currentUser.carNumber,
      type: selectedReqType,
      stationName: stationName,
      quantityLiters: qty,
      unitPrice: unitPrice,
      totalCost: total,
      details: reqDetails,
      odometerReading: parseFloat(odometer) || 0,
      imageUri: attachmentUri || undefined,
      dateTime: new Date().toLocaleString('ar-YE'),
      status: 'قيد الانتظار',
    };

    const updated = [newReq, ...requests];
    saveData(undefined, undefined, updated);

    Alert.alert('تم بنجاح', 'تم إرسال الطلب بنجاح إلى الإدارة.');
    setFuelQuantity('');
    setStationName('');
    setOdometer('');
    setReqDetails('');
    setAttachmentUri(null);
    setEstimatedCostInput('');
  };

  const handleChangePassword = () => {
    if (!currentUser) return;
    if (currentUser.password !== oldPassword) {
      Alert.alert('خطأ', 'كلمة المرور القديمة غير صحيحة');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    const updatedUsers = users.map((u) =>
      u.username === currentUser.username ? { ...u, password: newPassword.trim() } : u
    );

    setCurrentUser({ ...currentUser, password: newPassword.trim() });
    saveData(updatedUsers, undefined, undefined);
    Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح');
    setOldPassword('');
    setNewPassword('');
  };

  const handleSavePricing = () => {
    const newFuelPrice = parseFloat(fuelPriceInput) || prices.fuelPricePerLiter;
    const newOilPrice = parseFloat(oilPriceInput) || prices.oilPricePerLiter;

    const newPrices = { fuelPricePerLiter: newFuelPrice, oilPricePerLiter: newOilPrice };
    saveData(undefined, newPrices, undefined);
    Alert.alert('تم', 'تم تحديث أسعار المحروقات والزيوت بنجاح');
  };

  const handleAddCarDriver = () => {
    if (!newDriverUser.trim() || !newCarNo.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم ورقم السيارة');
      return;
    }

    const newUser: User = {
      username: newDriverUser.trim(),
      password: '000',
      role: 'Driver',
      carNumber: newCarNo.trim(),
      driverName: newDriverName.trim() || `سائق ${newDriverUser}`,
    };

    saveData([...users, newUser], undefined, undefined);
    Alert.alert('تم', 'تم إضافة السيارة والسائق بنجاح');
    setNewDriverUser('');
    setNewDriverName('');
    setNewCarNo('');
  };

  const handleUpdateReqStatus = (id: string, status: RequestStatus) => {
    const updated = requests.map((r) => (r.id === id ? { ...r, status } : r));
    saveData(undefined, undefined, updated);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authBox}>
            <View style={styles.truckContainer}>
              <View style={styles.truckCabin}>
                <Text style={styles.truckWindow}>🚛</Text>
              </View>
              <View style={styles.truckBody}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoBadgeText}>YCPD</Text>
                  <View style={styles.logoSmile} />
                  <Text style={styles.logoAtlasText}>أطلس</Text>
                </View>
              </View>
            </View>

            <Text style={styles.appTitle}>تطبيق السيارات والأسطول</Text>
            <Text style={styles.appSubTitle}>شركة YCPD - أطلس</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم المستخدم / الرقم الوظيفي:</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسم المستخدم"
                value={loginUsername}
                onChangeText={setLoginUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور:</Text>
              <TextInput
                style={styles.input}
                placeholder="****"
                secureTextEntry
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
              <Text style={styles.btnText}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const userRequests = requests.filter((r) => r.driverUsername === currentUser.username);
  const totalFuelLiters = userRequests
    .filter((r) => r.type === 'محروقات' && r.status === 'تمت الموافقة')
    .reduce((sum, r) => sum + (r.quantityLiters || 0), 0);
  const totalExpenses = userRequests
    .filter((r) => r.status === 'تمت الموافقة')
    .reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topInfoBar}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>رقم السيارة:</Text>
          <Text style={styles.infoValue}>{currentUser.carNumber}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>السائق:</Text>
          <Text style={styles.infoValue}>{currentUser.driverName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutChip} onPress={handleLogout}>
          <Text style={styles.logoutChipText}>خروج</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {currentUser.role === 'Admin' ? (
          <TouchableOpacity
            style={[styles.tabItem, currentTab === 'admin_panel' && styles.activeTabItem]}
            onPress={() => setCurrentTab('admin_panel')}
          >
            <Text style={styles.tabText}>لوحة الإدارة</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.tabItem, currentTab === 'requests' && styles.activeTabItem]}
              onPress={() => setCurrentTab('requests')}
            >
              <Text style={styles.tabText}>الطلبات</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, currentTab === 'inquiries' && styles.activeTabItem]}
              onPress={() => setCurrentTab('inquiries')}
            >
              <Text style={styles.tabText}>استعلامات</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, currentTab === 'change_pass' && styles.activeTabItem]}
              onPress={() => setCurrentTab('change_pass')}
            >
              <Text style={styles.tabText}>تغيير السّر</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView style={styles.content}>
        {currentTab === 'requests' && (
          <View>
            <Text style={styles.sectionHeader}>تقديم طلب جديد</Text>
            
            <View style={styles.typeSelector}>
              {(['محروقات', 'زيوت', 'قطع غيار', 'صيانة'] as RequestType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, selectedReqType === t && styles.activeTypeBtn]}
                  onPress={() => setSelectedReqType(t)}
                >
                  <Text style={[styles.typeBtnText, selectedReqType === t && styles.activeTypeBtnText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formCard}>
              {selectedReqType === 'محروقات' && (
                <>
                  <Text style={styles.priceNotice}>
                    سعر اللتر المعتمد حالياً: {prices.fuelPricePerLiter.toLocaleString()} ريال/لتر
                  </Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>الكمية باللتر:</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="مثال: 50"
                      value={fuelQuantity}
                      onChangeText={setFuelQuantity}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>اسم المحطة:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="اسم المحطة"
                      value={stationName}
                      onChangeText={setStationName}
                    />
                  </View>

                  <Text style={styles.calcTotalText}>
                    الإجمالي التقديري: {((parseFloat(fuelQuantity) || 0) * prices.fuelPricePerLiter).toLocaleString()} ريال
                  </Text>
                </>
              )}

              {selectedReqType !== 'محروقات' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>التكلفة التقديرية (ريال):</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="التكلفة بالريال"
                    value={estimatedCostInput}
                    onChangeText={setEstimatedCostInput}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>قراءة العداد (الكرونة / كم):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="قراءة العداد الحالية"
                  value={odometer}
                  onChangeText={setOdometer}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>تفاصيل وملاحظات الطلب:</Text>
                <TextInput
                  style={[styles.input, { height: 70 }]}
                  multiline
                  placeholder="اكتب التفاصيل هنا..."
                  value={reqDetails}
                  onChangeText={setReqDetails}
                />
              </View>

              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Text style={styles.attachBtnText}>
                  {attachmentUri ? '✔️ تم إرفاق الصورة (اضغط للتغيير)' : '📷 إرفاق صورة الفاتورة / المرفق'}
                </Text>
              </TouchableOpacity>

              {attachmentUri && (
                <Image source={{ uri: attachmentUri }} style={styles.previewImage} />
              )}

              <TouchableOpacity style={styles.btnPrimary} onPress={handleSendRequest}>
                <Text style={styles.btnText}>إرسال الطلب</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'inquiries' && (
          <View>
            <Text style={styles.sectionHeader}>استعلامات المسحوبات والتكاليف</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>إجمالي المحروقات</Text>
                <Text style={styles.statVal}>{totalFuelLiters.toLocaleString()} لتر</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>إجمالي المصاريف</Text>
                <Text style={[styles.statVal, { color: '#2e7d32' }]}>{totalExpenses.toLocaleString()} ر.ي</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>سجل طلباتي السابق</Text>
            {userRequests.map((r) => (
              <View key={r.id} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <Text style={styles.reqType}>{r.type}</Text>
                  <Text style={[styles.statusBadge, r.status === 'تمت الموافقة' ? styles.statusApproved : r.status === 'مرفوض' ? styles.statusRejected : styles.statusPending]}>
                    {r.status}
                  </Text>
                </View>
                <Text style={styles.reqDetail}>التاريخ: {r.dateTime}</Text>
                {r.type === 'محروقات' && (
                  <Text style={styles.reqDetail}>الكمية: {r.quantityLiters} لتر (المحطة: {r.stationName || 'غير محدد'})</Text>
                )}
                <Text style={styles.reqDetail}>المبلغ: {r.totalCost.toLocaleString()} ريال</Text>
                <Text style={styles.reqDetail}>قراءة العداد: {r.odometerReading} كم</Text>
                {r.details ? <Text style={styles.reqDetail}>ملاحظات: {r.details}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {currentTab === 'change_pass' && (
          <View style={styles.formCard}>
            <Text style={styles.sectionHeader}>تغيير كلمة المرور الخاصة بك</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور الحالية:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور الجديدة:</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleChangePassword}>
              <Text style={styles.btnText}>حفظ كلمة المرور الجديدة</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentTab === 'admin_panel' && currentUser.role === 'Admin' && (
          <View>
            <View style={styles.adminSubNav}>
              <TouchableOpacity
                style={[styles.adminNavBtn, adminTab === 'manage_requests' && styles.activeAdminNav]}
                onPress={() => setAdminTab('manage_requests')}
              >
                <Text style={styles.adminNavText}>إدارة الطلبات</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminNavBtn, adminTab === 'pricing' && styles.activeAdminNav]}
                onPress={() => setAdminTab('pricing')}
              >
                <Text style={styles.adminNavText}>تكويد الأسعار</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminNavBtn, adminTab === 'cars' && styles.activeAdminNav]}
                onPress={() => setAdminTab('cars')}
              >
                <Text style={styles.adminNavText}>السيارات والسائقين</Text>
              </TouchableOpacity>
            </View>

            {adminTab === 'manage_requests' && (
              <View>
                <Text style={styles.sectionHeader}>طلبات السيارات الواردة</Text>
                {requests.map((r) => (
                  <View key={r.id} style={styles.reqCard}>
                    <Text style={styles.cardTitle}>السائق: {r.driverName} ({r.carNumber})</Text>
                    <Text style={styles.reqDetail}>الطلب: {r.type} | {r.dateTime}</Text>
                    {r.type === 'محروقات' && (
                      <Text style={styles.reqDetail}>الكمية: {r.quantityLiters} لتر × {r.unitPrice} ريال</Text>
                    )}
                    <Text style={styles.reqDetail}>إجمالي المبلغ: {r.totalCost.toLocaleString()} ريال</Text>
                    <Text style={styles.reqDetail}>عداد السيارة: {r.odometerReading} كم</Text>
                    {r.details ? <Text style={styles.reqDetail}>ملاحظات: {r.details}</Text> : null}
                    
                    {r.imageUri && (
                      <Image source={{ uri: r.imageUri }} style={styles.previewImage} />
                    )}

                    <Text style={styles.reqDetail}>الحالة: {r.status}</Text>
                    
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: '#2e7d32' }]}
                        onPress={() => handleUpdateReqStatus(r.id, 'تمت الموافقة')}
                      >
                        <Text style={styles.btnText}>موافقة</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: '#c62828' }]}
                        onPress={() => handleUpdateReqStatus(r.id, 'مرفوض')}
                      >
                        <Text style={styles.btnText}>رفض</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {adminTab === 'pricing' && (
              <View style={styles.formCard}>
                <Text style={styles.sectionHeader}>شاشة تكويد وتعديل الأسعار</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>سعر لتر المحروقات الحالي (ريال): {prices.fuelPricePerLiter}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="أدخل السعر الجديد للتر"
                    value={fuelPriceInput}
                    onChangeText={setFuelPriceInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>سعر لتر الزيت الحالي (ريال): {prices.oilPricePerLiter}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="أدخل سعر الزيت الجديد"
                    value={oilPriceInput}
                    onChangeText={setOilPriceInput}
                  />
                </View>

                <TouchableOpacity style={styles.btnPrimary} onPress={handleSavePricing}>
                  <Text style={styles.btnText}>تحديث الأسعار في النظام</Text>
                </TouchableOpacity>
              </View>
            )}

            {adminTab === 'cars' && (
              <View>
                <View style={styles.formCard}>
                  <Text style={styles.sectionHeader}>إضافة سيارة وسائق جديد</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="اسم المستخدم (مثال: 55210)"
                    value={newDriverUser}
                    onChangeText={setNewDriverUser}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="اسم السائق"
                    value={newDriverName}
                    onChangeText={setNewDriverName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="رقم لوحة السيارة"
                    value={newCarNo}
                    onChangeText={setNewCarNo}
                  />
                  <TouchableOpacity style={styles.btnPrimary} onPress={handleAddCarDriver}>
                    <Text style={styles.btnText}>إضافة النظام</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionHeader}>قائمة السيارات والسائقين المسجلين</Text>
                {users.map((u) => (
                  <View key={u.username} style={styles.userRow}>
                    <Text style={styles.userRowText}>{u.driverName} | سيارة: {u.carNumber} (مستخدم: {u.username})</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  authScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  authBox: { backgroundColor: '#ffffff', borderRadius: 15, padding: 20, elevation: 4, alignItems: 'center' },
  truckContainer: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  truckCabin: { width: 50, height: 50, backgroundColor: '#1565c0', borderTopLeftRadius: 15, justifyContent: 'center', alignItems: 'center' },
  truckWindow: { fontSize: 24 },
  truckBody: { width: 140, height: 70, backgroundColor: '#0d47a1', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  logoBadge: { backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 12, paddingVertical: 4, alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  logoBadgeText: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  logoSmile: { width: 25, height: 8, borderBottomWidth: 3, borderBottomColor: '#d32f2f', borderRadius: 10 },
  logoAtlasText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: '#0d47a1', marginTop: 10 },
  appSubTitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  inputGroup: { width: '100%', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4, textAlign: 'right' },
  input: { backgroundColor: '#f0f4f8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, textAlign: 'right', borderWidth: 1, borderColor: '#ccc', marginBottom: 8 },
  btnPrimary: { backgroundColor: '#1565c0', borderRadius: 8, paddingVertical: 12, width: '100%', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  topInfoBar: { backgroundColor: '#0d47a1', padding: 12, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { alignItems: 'flex-start' },
  infoLabel: { color: '#bbdefb', fontSize: 12 },
  infoValue: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  logoutChip: { backgroundColor: '#c62828', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  logoutChipText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row-reverse', backgroundColor: '#fff', elevation: 2 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: '#1565c0' },
  tabText: { fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 15 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#0d47a1', marginVertical: 10, textAlign: 'right' },
  typeSelector: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 15 },
  typeBtn: { flex: 1, backgroundColor: '#e0e0e0', paddingVertical: 8, marginHorizontal: 2, borderRadius: 6, alignItems: 'center' },
  activeTypeBtn: { backgroundColor: '#1565c0' },
  typeBtnText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  activeTypeBtnText: { color: '#fff' },
  formCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  priceNotice: { color: '#d32f2f', fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  calcTotalText: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginVertical: 8, textAlign: 'right' },
  attachBtn: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 10, borderWidth: 1, borderColor: '#90caf9' },
  attachBtnText: { color: '#1565c0', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 150, borderRadius: 8, marginVertical: 10 },
  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 15 },
  statBox: { flex: 0.48, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', elevation: 2 },
  statTitle: { fontSize: 12, color: '#666' },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#0d47a1', marginTop: 4 },
  reqCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, elevation: 2 },
  reqHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  reqType: { fontWeight: 'bold', fontSize: 16, color: '#0d47a1' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusPending: { backgroundColor: '#f57c00' },
  statusApproved: { backgroundColor: '#388e3c' },
  statusRejected: { backgroundColor: '#d32f2f' },
  reqDetail: { textAlign: 'right', color: '#444', marginBottom: 3 },
  adminSubNav: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 15 },
  adminNavBtn: { flex: 1, backgroundColor: '#fff', paddingVertical: 8, marginHorizontal: 2, borderRadius: 6, alignItems: 'center', elevation: 1 },
  activeAdminNav: { backgroundColor: '#0d47a1' },
  adminNavText: { fontWeight: 'bold', color: '#333', fontSize: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 15, textAlign: 'right', marginBottom: 5 },
  actionRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 10 },
  smallBtn: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 6 },
  userRow: { backgroundColor: '#fff', padding: 12, borderRadius: 6, marginBottom: 6 },
  userRowText: { textAlign: 'right', fontSize: 14 },
});
