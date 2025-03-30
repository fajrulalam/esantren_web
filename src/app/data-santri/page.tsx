"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/auth';
import { 
  collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Santri, SantriFormData } from '@/types/santri';
import { KODE_ASRAMA } from '@/constants';
import SantriModal from '@/components/SantriModal';
import CSVImportModal from '@/components/CSVImportModal';
import ImportProgressPanel from '@/components/ImportProgressPanel';
import { exportToExcel } from '@/utils/excelExport';
import { formatName, formatNameForId } from '@/utils/nameFormatter';

export default function DataSantriPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Santri data state
  const [santris, setSantris] = useState<Santri[]>([]);
  const [filteredSantris, setFilteredSantris] = useState<Santri[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state
  const [statusAktifFilter, setStatusAktifFilter] = useState<string>('all');
  const [jenjangFilter, setJenjangFilter] = useState<string>('all');
  const [programStudiFilter, setProgramStudiFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all'); 
  const [tahunMasukFilter, setTahunMasukFilter] = useState<string>('all');
  const [statusTanggunganFilter, setStatusTanggunganFilter] = useState<string>('all');
  const [kamarFilter, setKamarFilter] = useState<string>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<Santri | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bulk actions state
  const [selectedSantriIds, setSelectedSantriIds] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  
  // Import progress state
  const [importProgress, setImportProgress] = useState({
    isActive: false,
    totalItems: 0,
    currentItemIndex: 0,
    currentItemName: '',
    successCount: 0,
    errorCount: 0,
    operation: 'import' as 'import' | 'delete'
  });
  
  // Get unique values for filter dropdowns
  const uniqueTahunMasuk = [...new Set(santris.map(santri => santri.tahunMasuk))].sort((a, b) => parseInt(b) - parseInt(a));
  const uniqueKamar = [...new Set(santris.map(santri => santri.kamar))].sort();
  const uniqueJenjang = [...new Set(santris.map(santri => santri.jenjangPendidikan))].sort();
  const uniqueSemester = [...new Set(santris.map(santri => santri.semester).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));
  const uniqueProgramStudi = [...new Set(santris.map(santri => santri.programStudi).filter(Boolean))].sort();
  
  // Auth check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'waliSantri') {
        router.push('/payment-history');
      } else {
        setIsAuthorized(true);
        fetchSantris();
      }
    }
  }, [user, loading, router]);
  
  // Fetch santri data
  const fetchSantris = async () => {
    try {
      setIsLoading(true);
      const santriRef = collection(db, "SantriCollection");
      const q = query(santriRef, where("kodeAsrama", "==", KODE_ASRAMA));
      const querySnapshot = await getDocs(q);
      
      const santriData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Santri[];
      
      setSantris(santriData);
      setFilteredSantris(santriData);
    } catch (error) {
      console.error("Error fetching santri data:", error);
      alert("Terjadi kesalahan saat mengambil data santri");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters to santri data
  useEffect(() => {
    let filtered = [...santris];
    
    if (statusAktifFilter !== 'all') {
      filtered = filtered.filter(santri => santri.statusAktif === statusAktifFilter);
    }
    
    if (jenjangFilter !== 'all') {
      filtered = filtered.filter(santri => santri.jenjangPendidikan === jenjangFilter);
    }
    
    if (programStudiFilter !== 'all') {
      filtered = filtered.filter(santri => santri.programStudi === programStudiFilter);
    }
    
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(santri => santri.semester === semesterFilter);
    }
    
    if (tahunMasukFilter !== 'all') {
      filtered = filtered.filter(santri => santri.tahunMasuk === tahunMasukFilter);
    }
    
    if (statusTanggunganFilter !== 'all') {
      filtered = filtered.filter(santri => santri.statusTanggungan === statusTanggunganFilter);
    }
    
    if (kamarFilter !== 'all') {
      filtered = filtered.filter(santri => santri.kamar === kamarFilter);
    }
    
    setFilteredSantris(filtered);
    
    // Reset selection when filters change
    setSelectedSantriIds(new Set());
    setIsSelectAll(false);
  }, [santris, statusAktifFilter, jenjangFilter, programStudiFilter, semesterFilter, tahunMasukFilter, statusTanggunganFilter, kamarFilter]);
  
  // Reset filters
  const resetFilters = () => {
    setStatusAktifFilter('all');
    setJenjangFilter('all');
    setProgramStudiFilter('all');
    setSemesterFilter('all');
    setTahunMasukFilter('all');
    setStatusTanggunganFilter('all');
    setKamarFilter('all');
  };
  
  // Handle adding a new santri
  const handleAddSantri = () => {
    setSelectedSantri(undefined);
    setIsModalOpen(true);
  };
  
  // Handle editing a santri
  const handleEditSantri = (santri: Santri) => {
    setSelectedSantri(santri);
    setIsModalOpen(true);
  };
  
  // Handle form submission (add or update)
  const handleSantriSubmit = async (formData: SantriFormData) => {
    try {
      setIsSubmitting(true);
      
      if (selectedSantri) {
        // Format the name properly
        const formattedName = formatName(formData.nama);
        
        // Update existing santri with formatted name
        const santriRef = doc(db, "SantriCollection", selectedSantri.id);
        await updateDoc(santriRef, {
          ...formData,
          nama: formattedName, // Use properly formatted name
          kodeAsrama: KODE_ASRAMA,
        });
        
        // Update local state
        setSantris(prev => 
          prev.map(s => s.id === selectedSantri.id ? 
            { ...s, ...formData, nama: formattedName, kodeAsrama: KODE_ASRAMA } : s
          )
        );
      } else {
        // Format the name properly
        const formattedName = formatName(formData.nama);
        
        // Add new santri with formatted ID
        const timestamp = Date.now();
        const formattedNameForId = formatNameForId(formattedName);
        const docId = `${formattedNameForId}_${timestamp}`;
        
        // Create santri data with properly formatted name
        const santriData = {
          ...formData,
          nama: formattedName, // Use the properly formatted name
          kodeAsrama: KODE_ASRAMA,
          statusTanggungan: "Belum Ada Tagihan",
          createdAt: timestamp,
          jumlahTunggakan: 0
        };
        
        // Create new document with custom ID
        await updateDoc(doc(db, "SantriCollection", docId), santriData).catch(async () => {
          // If doc doesn't exist, set it instead
          const docRef = doc(db, "SantriCollection", docId);
          await setDoc(docRef, santriData);
        });
        
        // Get the new document
        const newSantriSnap = await getDoc(doc(db, "SantriCollection", docId));
        const newSantri = {
          id: docId,
          ...newSantriSnap.data()
        } as Santri;
        
        // Update local state
        setSantris(prev => [...prev, newSantri]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving santri data:", error);
      alert("Terjadi kesalahan saat menyimpan data santri");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete santri
  const handleDeleteSantri = async (santri: Santri) => {
    try {
      setIsSubmitting(true);
      
      // Delete santri document
      const santriRef = doc(db, "SantriCollection", santri.id);
      await deleteDoc(santriRef);
      
      // Update local state
      setSantris(prev => prev.filter(s => s.id !== santri.id));
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting santri:", error);
      alert("Terjadi kesalahan saat menghapus data santri");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Export to Excel
  const handleExportToExcel = () => {
    // Use filtered data for export
    exportToExcel(filteredSantris, `Data-Santri-${new Date().toISOString().split('T')[0]}`);
  };
  
  // Handle CSV import modal
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };
  
  // Process CSV import
  const handleBulkImport = async (santriDataList: SantriFormData[]) => {
    try {
      setIsImportModalOpen(false);
      
      // Setup progress tracking
      setImportProgress({
        isActive: true,
        totalItems: santriDataList.length,
        currentItemIndex: 0,
        currentItemName: '',
        successCount: 0,
        errorCount: 0,
        operation: 'import'
      });
      
      // Process each santri data asynchronously
      for (let i = 0; i < santriDataList.length; i++) {
        const santriData = santriDataList[i];
        
        // Update progress
        setImportProgress(prev => ({
          ...prev,
          currentItemIndex: i,
          currentItemName: santriData.nama
        }));
        
        try {
          // Format the name properly
          const formattedName = formatName(santriData.nama);
          
          // Create a new document ID
          const timestamp = Date.now() + i; // Add index to ensure unique timestamps
          const formattedNameForId = formatNameForId(formattedName);
          const docId = `${formattedNameForId}_${timestamp}`;
          
          // Create document with formatted name
          await setDoc(doc(db, "SantriCollection", docId), {
            ...santriData,
            nama: formattedName, // Use the properly formatted name
            kodeAsrama: KODE_ASRAMA,
            statusTanggungan: "Belum Ada Tagihan",
            createdAt: timestamp,
            jumlahTunggakan: 0
          });
          
          // Update success count
          setImportProgress(prev => ({
            ...prev,
            successCount: prev.successCount + 1
          }));
          
          // Small delay to avoid overwhelming Firestore
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error importing santri ${santriData.nama}:`, error);
          
          // Update error count
          setImportProgress(prev => ({
            ...prev,
            errorCount: prev.errorCount + 1
          }));
        }
      }
      
      // Complete the progress
      setImportProgress(prev => ({
        ...prev,
        currentItemIndex: santriDataList.length,
        currentItemName: 'Completed'
      }));
      
      // Refresh santri data after import
      fetchSantris();
      
    } catch (error) {
      console.error("Error during bulk import:", error);
      alert("Terjadi kesalahan saat mengimpor data santri");
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedSantriIds.size === 0) return;
    
    const confirmDelete = window.confirm(`Yakin akan menghapus ${selectedSantriIds.size} santri terpilih?`);
    if (!confirmDelete) return;
    
    try {
      // Setup progress tracking
      setImportProgress({
        isActive: true,
        totalItems: selectedSantriIds.size,
        currentItemIndex: 0,
        currentItemName: '',
        successCount: 0,
        errorCount: 0,
        operation: 'delete'
      });
      
      // Get selected santris
      const selectedSantriList = santris.filter(s => selectedSantriIds.has(s.id));
      
      // Use batched writes for better performance, but process in smaller batches
      const BATCH_SIZE = 20;
      for (let i = 0; i < selectedSantriList.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const currentBatch = selectedSantriList.slice(i, i + BATCH_SIZE);
        
        for (let j = 0; j < currentBatch.length; j++) {
          const santri = currentBatch[j];
          const currentIndex = i + j;
          
          // Update progress
          setImportProgress(prev => ({
            ...prev,
            currentItemIndex: currentIndex,
            currentItemName: santri.nama
          }));
          
          try {
            // Add delete operation to batch
            const santriRef = doc(db, "SantriCollection", santri.id);
            batch.delete(santriRef);
            
            // Update success count (anticipating success)
            setImportProgress(prev => ({
              ...prev,
              successCount: prev.successCount + 1
            }));
          } catch (error) {
            console.error(`Error preparing deletion for ${santri.nama}:`, error);
            
            // Update error count
            setImportProgress(prev => ({
              ...prev,
              errorCount: prev.errorCount + 1
            }));
          }
        }
        
        // Commit the batch
        try {
          await batch.commit();
        } catch (error) {
          console.error(`Error committing batch:`, error);
          
          // Update error count for the batch - this is a simplified approach
          setImportProgress(prev => ({
            ...prev,
            successCount: Math.max(0, prev.successCount - currentBatch.length),
            errorCount: prev.errorCount + currentBatch.length
          }));
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Complete the progress
      setImportProgress(prev => ({
        ...prev,
        currentItemIndex: selectedSantriIds.size,
        currentItemName: 'Completed'
      }));
      
      // Update local state
      setSantris(prev => prev.filter(s => !selectedSantriIds.has(s.id)));
      setSelectedSantriIds(new Set());
      setIsSelectAll(false);
      
    } catch (error) {
      console.error("Error during bulk delete:", error);
      alert("Terjadi kesalahan saat menghapus data santri");
    }
  };
  
  // Handle select all checkboxes
  const handleSelectAll = () => {
    if (isSelectAll) {
      // Deselect all
      setSelectedSantriIds(new Set());
    } else {
      // Select all filtered santris
      const newSelectedIds = new Set<string>();
      filteredSantris.forEach(santri => newSelectedIds.add(santri.id));
      setSelectedSantriIds(newSelectedIds);
    }
    setIsSelectAll(!isSelectAll);
  };
  
  // Handle individual checkbox selection
  const handleSelectSantri = (santriId: string) => {
    const newSelectedIds = new Set(selectedSantriIds);
    if (newSelectedIds.has(santriId)) {
      newSelectedIds.delete(santriId);
    } else {
      newSelectedIds.add(santriId);
    }
    setSelectedSantriIds(newSelectedIds);
    
    // Update isSelectAll state
    setIsSelectAll(newSelectedIds.size === filteredSantris.length);
  };
  
  // Reset progress panel
  const handleResetProgress = () => {
    setImportProgress({
      isActive: false,
      totalItems: 0,
      currentItemIndex: 0,
      currentItemName: '',
      successCount: 0,
      errorCount: 0,
      operation: 'import'
    });
  };
  
  if (loading || !isAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 dark:bg-gray-900 transition-colors">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold dark:text-white transition-colors">Data Santri</h1>
        <div className="flex flex-wrap gap-2">
          {selectedSantriIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Hapus ({selectedSantriIds.size}) Terpilih
            </button>
          )}
          <button
            onClick={handleExportToExcel}
            className="bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 border border-green-600 dark:border-green-500 px-4 py-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
          >
            Export Excel
          </button>
          <button
            onClick={handleOpenImportModal}
            className="bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-500 px-4 py-2 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={handleAddSantri}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Tambah Santri Baru
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Status Aktif
            </label>
            <select
              value={statusAktifFilter}
              onChange={(e) => setStatusAktifFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Boyong">Boyong</option>
              <option value="Lulus">Lulus</option>
              <option value="Dikeluarkan">Dikeluarkan</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Jenjang Pendidikan
            </label>
            <select
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="all">Semua Jenjang</option>
              {uniqueJenjang.map((jenjang) => (
                <option key={jenjang} value={jenjang}>{jenjang}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Program Studi
            </label>
            <select
              value={programStudiFilter}
              onChange={(e) => setProgramStudiFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="all">Semua Program Studi</option>
              {uniqueProgramStudi.map((prodi) => (
                <option key={prodi} value={prodi}>{prodi}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Semester
            </label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="all">Semua Semester</option>
              {uniqueSemester.map((semester) => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Tahun Masuk
            </label>
            <select
              value={tahunMasukFilter}
              onChange={(e) => setTahunMasukFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="all">Semua Tahun</option>
              {uniqueTahunMasuk.map((tahun) => (
                <option key={tahun} value={tahun}>{tahun}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Status Tanggungan
            </label>
            <select
              value={statusTanggunganFilter}
              onChange={(e) => setStatusTanggunganFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Ada Tagihan">Belum Ada Tagihan</option>
              <option value="Ada Tunggakan">Belum Lunas</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Kamar
            </label>
            <select
              value={kamarFilter}
              onChange={(e) => setKamarFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
            >
              <option value="all">Semua Kamar</option>
              {uniqueKamar.map((kamar) => (
                <option key={kamar} value={kamar}>{kamar}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end col-span-1 md:col-span-3 lg:col-span-8">
            <button
              onClick={resetFilters}
              className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto transition-colors">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSantris.length === 0 ? (
          <p className="text-xl text-center text-gray-500 dark:text-gray-400 py-12 transition-colors">
            Tidak ada data santri yang ditemukan
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
            <thead className="bg-gray-50 dark:bg-gray-900 transition-colors">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
                      checked={isSelectAll}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Nama Santri
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Kamar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Jenjang Pendidikan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Semester
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Program Studi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Tahun Masuk
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Nomor Wali Santri
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Status Tanggungan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Status Aktif
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
              {filteredSantris.map((santri) => (
                <tr key={santri.id} className={selectedSantriIds.has(santri.id) ? "bg-blue-50 dark:bg-blue-900/30" : ""}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
                        checked={selectedSantriIds.has(santri.id)}
                        onChange={() => handleSelectSantri(santri.id)}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors">
                    {santri.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 transition-colors">
                    {santri.kamar}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 transition-colors">
                    {santri.jenjangPendidikan || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 transition-colors">
                    {santri.semester || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 transition-colors">
                    {santri.programStudi || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 transition-colors">
                    {santri.tahunMasuk}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 transition-colors">
                    {santri.nomorWalisantri}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors 
                      ${santri.statusTanggungan === 'Lunas' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' : 
                      santri.statusTanggungan === 'Ada Tunggakan' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400' : 
                      santri.statusTanggungan === 'Belum Ada Tagihan' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      santri.statusTanggungan === 'Menunggu Verifikasi' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {santri.statusTanggungan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors 
                      ${santri.statusAktif === 'Aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' : 
                      santri.statusAktif === 'Boyong' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' : 
                      santri.statusAktif === 'Lulus' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
                      santri.statusAktif === 'Dikeluarkan' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {santri.statusAktif}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 transition-colors">
                    <button
                      onClick={() => handleEditSantri(santri)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Santri modal for add/edit */}
      <SantriModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        santri={selectedSantri}
        onSubmit={handleSantriSubmit}
        onDelete={handleDeleteSantri}
        isSubmitting={isSubmitting}
        title={selectedSantri ? 'Edit Data Santri' : 'Tambah Santri Baru'}
      />
      
      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
        isImporting={importProgress.isActive}
      />
      
      {/* Import Progress Panel */}
      <ImportProgressPanel
        isActive={importProgress.isActive}
        totalItems={importProgress.totalItems}
        currentItemIndex={importProgress.currentItemIndex}
        currentItemName={importProgress.currentItemName}
        successCount={importProgress.successCount}
        errorCount={importProgress.errorCount}
        operation={importProgress.operation}
        onClose={handleResetProgress}
      />
    </div>
  );
}