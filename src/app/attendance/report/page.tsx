'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { format } from 'date-fns';
import { generateAttendanceReport } from '@/firebase/attendance';
import { AttendanceReport } from '@/types/attendance';
import { KODE_ASRAMA } from '@/constants';

export default function AttendanceReportScreen() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<AttendanceReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const report = await generateAttendanceReport(
        KODE_ASRAMA, 
        new Date(startDate), 
        new Date(endDate + 'T23:59:59')
      );
      setReportData(report);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Gagal membuat laporan. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCsv = () => {
    if (!reportData) return;

    // Generate CSV content
    const headers = "Nama,Hadir,Tidak Hadir,Sakit,Pulang,Tidak Diketahui,Persentase Kehadiran\n";
    const rows = reportData.studentReports.map(student =>
      `"${student.nama}",${student.presentCount},${student.absentCount},${student.sickCount},${student.pulangCount},${student.unknownCount},${student.attendanceRate}`
    ).join("\n");

    // Create and download CSV file
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-kehadiran-${reportData.kodeAsrama}-${format(reportData.startDate, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Laporan Kehadiran</h1>
          <button
            onClick={() => router.push('/attendance')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>

      <div className="report-controls bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Filter Laporan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            />
          </div>

          <div className="form-group flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Menghasilkan Laporan...' : 'Hasilkan Laporan'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          <div className="report-summary bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Ringkasan Laporan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Asrama</p>
                <p className="font-medium">{reportData.kodeAsrama}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Periode</p>
                <p className="font-medium">
                  {format(reportData.startDate, 'dd MMM yyyy')} hingga {format(reportData.endDate, 'dd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Total Sesi</p>
                <p className="font-medium">{reportData.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="report-actions flex gap-3 mb-6">
            <button 
              onClick={handleExportCsv}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Ekspor CSV
            </button>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Cetak Laporan
            </button>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <table className="report-table w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-200">Nama</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-200">Hadir</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-200">Tidak Hadir</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-200">Sakit</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-200">Pulang</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-200">Tidak Diketahui</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-200">Persentase Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.studentReports.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm">{student.nama}</td>
                    <td className="px-4 py-3 text-sm text-center">{student.presentCount}</td>
                    <td className="px-4 py-3 text-sm text-center">{student.absentCount}</td>
                    <td className="px-4 py-3 text-sm text-center">{student.sickCount}</td>
                    <td className="px-4 py-3 text-sm text-center">{student.pulangCount}</td>
                    <td className="px-4 py-3 text-sm text-center">{student.unknownCount}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium">
                      {student.attendanceRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}