import React, { useState, useEffect } from 'react';
import { Search, LogOut, Upload, Eye, Edit2, Check, X, AlertCircle, CheckCircle, Trash2, ZoomIn, RotateCcw, Trash } from 'lucide-react';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState('login');
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [viewImage, setViewImage] = useState(null);

  // Admin Secret Code
  const ADMIN_SECRET_CODE = 'ADMIN2025';

  // Popup Function
  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type });
  };

  // Auto hide popup after 3 seconds
  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(() => {
        setPopup({ show: false, message: '', type: 'success' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [popup.show]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const usersData = localStorage.getItem('users');
      const submissionsData = localStorage.getItem('submissions');
      
      if (usersData) setUsers(JSON.parse(usersData));
      if (submissionsData) setSubmissions(JSON.parse(submissionsData));
    } catch (error) {
      console.log('No data found, starting fresh');
    }
  };

  const saveUsers = (newUsers) => {
    localStorage.setItem('users', JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const saveSubmissions = (newSubmissions) => {
    localStorage.setItem('submissions', JSON.stringify(newSubmissions));
    setSubmissions(newSubmissions);
  };

  // Auth Functions
  const handleRegister = (email, password, name, adminCode = '') => {
    if (!email.endsWith('@taweethapisek.ac.th')) {
      showPopup('กรุณาใช้ Email โรงเรียน (@taweethapisek.ac.th)', 'error');
      return;
    }

    const isAdmin = adminCode === ADMIN_SECRET_CODE;
    
    if (adminCode && !isAdmin) {
      showPopup('รหัส Admin ไม่ถูกต้อง', 'error');
      return;
    }

    if (users.find(u => u.email === email)) {
      showPopup('Email นี้ถูกใช้งานแล้ว', 'error');
      return;
    }
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      isAdmin
    };
    
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    showPopup(isAdmin ? 'สมัครสมาชิก Admin สำเร็จ!' : 'สมัครสมาชิกสำเร็จ!', 'success');
    setPage('login');
  };

  const handleLogin = (email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setPage(user.isAdmin ? 'admin' : 'submit');
    } else {
      showPopup('Email หรือ Password ไม่ถูกต้อง', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('login');
  };

  // Submit Work
  const handleSubmitWork = (workData) => {
    const newSubmission = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: workData.studentName,
      studentId: workData.studentId,
      ...workData,
      submittedAt: new Date().toISOString(),
      status: 'ยังไม่ตรวจ'
    };
    
    const updatedSubmissions = [...submissions, newSubmission];
    saveSubmissions(updatedSubmissions);
    showPopup('ส่งงานสำเร็จ!', 'success');
    setPage('history');
  };

  // Admin Functions
  const updateSubmissionStatus = (submissionId, newStatus) => {
    const updatedSubmissions = submissions.map(sub =>
      sub.id === submissionId ? { ...sub, status: newStatus } : sub
    );
    saveSubmissions(updatedSubmissions);
  };

  const updateSubmission = (submissionId, updatedData) => {
    const updatedSubmissions = submissions.map(sub => {
      if (sub.id === submissionId) {
        const updated = { ...sub, ...updatedData };
        // ถ้าเปลี่ยนเป็น "ตรวจแล้ว" ให้บันทึกวันที่
        if (updatedData.status === 'ตรวจแล้ว' && !sub.completedAt) {
          updated.completedAt = new Date().toISOString();
        }
        return updated;
      }
      return sub;
    });
    saveSubmissions(updatedSubmissions);
    showPopup('บันทึกข้อมูลสำเร็จ', 'success');
  };

  const deleteSubmission = (submissionId) => {
    const updatedSubmissions = submissions.map(sub =>
      sub.id === submissionId ? { ...sub, isDeleted: true, deletedAt: new Date().toISOString() } : sub
    );
    saveSubmissions(updatedSubmissions);
    showPopup('ย้ายงานไปถังขยะแล้ว', 'success');
  };

  const restoreSubmission = (submissionId) => {
    const updatedSubmissions = submissions.map(sub => {
      if (sub.id === submissionId) {
        const { isDeleted, deletedAt, ...rest } = sub;
        return rest;
      }
      return sub;
    });
    saveSubmissions(updatedSubmissions);
    showPopup('กู้คืนงานสำเร็จ', 'success');
  };

  const permanentDeleteSubmission = (submissionId) => {
    const updatedSubmissions = submissions.filter(sub => sub.id !== submissionId);
    saveSubmissions(updatedSubmissions);
    showPopup('ลบงานถาวรสำเร็จ', 'success');
  };

  const getUserSubmissions = () => {
    return submissions.filter(sub => sub.userId === currentUser.id);
  };

  const getGroupedSubmissions = () => {
    const grouped = {};
    // กรองเฉพาะงานที่ไม่ถูกลบ
    submissions.filter(sub => !sub.isDeleted).forEach(sub => {
      const key = sub.studentId;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(sub);
    });
    
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    });
    
    return grouped;
  };

  // Components
  const Header = () => {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '2px solid #4CAF50', 
        padding: '20px 30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        animation: 'slideDown 0.5s ease-out'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px', 
            color: '#2c3e50',
            fontWeight: 'bold',
            letterSpacing: '-0.5px'
          }}>
            RegradePlus<span style={{ color: '#4CAF50' }}>+</span>
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            fontSize: '14px', 
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            กลุ่มสาระการเรียนรู้วิทยาศาสตร์ & เทคโนโลยี
          </p>
        </div>
      </div>
    );
  };

  const ImageViewer = () => {
    if (!viewImage) return null;

    return (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 10000,
          cursor: 'pointer'
        }} 
        onClick={() => setViewImage(null)}
      >
        <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
          <img 
            src={viewImage} 
            alt="Full view" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '90vh', 
              objectFit: 'contain',
              borderRadius: '8px'
            }} 
          />
          <button 
            onClick={() => setViewImage(null)}
            style={{ 
              position: 'absolute', 
              top: '-40px', 
              right: '0', 
              backgroundColor: 'white', 
              border: 'none', 
              borderRadius: '50%', 
              width: '35px', 
              height: '35px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const PopupNotification = () => {
    if (!popup.show) return null;

    return (
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out'
      }}>
        <div style={{ 
          backgroundColor: popup.type === 'success' ? '#4CAF50' : '#f44336',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '300px',
          maxWidth: '500px'
        }}>
          {popup.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <div style={{ flex: 1, fontSize: '15px', fontWeight: '500' }}>{popup.message}</div>
          <button 
            onClick={() => setPopup({ show: false, message: '', type: 'success' })}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  };

  const LoginPage = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', name: '', adminCode: '' });
    const [showAdminCode, setShowAdminCode] = useState(false);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (isRegister) {
        handleRegister(formData.email, formData.password, formData.name, formData.adminCode);
      } else {
        handleLogin(formData.email, formData.password);
      }
    };

    return (
      <div style={{ 
        minHeight: 'calc(100vh - 100px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{ 
          maxWidth: '420px', 
          width: '100%',
          padding: '40px', 
          border: '1px solid #e0e0e0', 
          backgroundColor: 'white', 
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          animation: 'fadeInUp 0.6s ease-out'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#2c3e50' }}>
              {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </h2>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              {isRegister ? 'สร้างบัญชีใหม่เพื่อเริ่มใช้งาน' : 'ยินดีต้อนรับกลับมา'}
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div style={{ marginBottom: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', transition: 'all 0.3s', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="yourname@taweethapisek.ac.th"
                required
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', transition: 'all 0.3s', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', transition: 'all 0.3s', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            
            {isRegister && (
              <div style={{ marginBottom: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', transition: 'all 0.3s' }}>
                  <input
                    type="checkbox"
                    checked={showAdminCode}
                    onChange={(e) => setShowAdminCode(e.target.checked)}
                    style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>ฉันเป็น Admin (ต้องมีรหัส Admin)</span>
                </label>
                
                {showAdminCode && (
                  <div style={{ marginTop: '12px', animation: 'fadeIn 0.3s ease-out' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>รหัส Admin</label>
                    <input
                      type="password"
                      value={formData.adminCode}
                      onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                      placeholder="กรุณาใส่รหัส Admin"
                      style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', transition: 'all 0.3s', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                )}
              </div>
            )}
            
            <button type="submit" style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '16px',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#45a049';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#4CAF50';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            }}>
              {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '24px', padding: '20px 0', borderTop: '1px solid #e0e0e0' }}>
            <span style={{ color: '#7f8c8d', fontSize: '14px' }}>
              {isRegister ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?'}
            </span>
            <button onClick={() => {
              setIsRegister(!isRegister);
              setFormData({ email: '', password: '', name: '', adminCode: '' });
              setShowAdminCode(false);
            }} style={{ 
              marginLeft: '8px', 
              background: 'none', 
              border: 'none', 
              color: '#4CAF50', 
              cursor: 'pointer', 
              fontWeight: '600', 
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
              {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SubmitWorkPage = () => {
    const [formData, setFormData] = useState({
      studentName: '',
      grade: '',
      studentId: '',
      subjectCode: '',
      subjectName: '',
      type: 'ศูนย์',
      year: new Date().getFullYear() + 543,
      date: new Date().toISOString().split('T')[0],
      images: []
    });

    const handleImageUpload = (e) => {
      const files = Array.from(e.target.files);
      Promise.all(files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      })).then(images => {
        setFormData({ ...formData, images: [...formData.images, ...images] });
      });
    };

    const removeImage = (index) => {
      const newImages = formData.images.filter((_, idx) => idx !== index);
      setFormData({ ...formData, images: newImages });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.images.length === 0) {
        showPopup('กรุณาอัปโหลดรูปงานอย่างน้อย 1 รูป', 'error');
        return;
      }
      handleSubmitWork(formData);
      setFormData({
        studentName: '',
        grade: '',
        studentId: '',
        subjectCode: '',
        subjectName: '',
        type: 'ศูนย์',
        year: new Date().getFullYear() + 543,
        date: new Date().toISOString().split('T')[0],
        images: []
      });
    };

    return (
      <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>ส่งงานแก้</h2>
          <div>
            <button onClick={() => setPage('history')} style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>ประวัติ</button>
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: '30px', backgroundColor: 'white', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ชื่อ-นามสกุล: *</label>
              <input type="text" value={formData.studentName} onChange={(e) => setFormData({ ...formData, studentName: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ชั้น: *</label>
              <input type="text" placeholder="เช่น ม.4/1" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>รหัสนักเรียน: *</label>
              <input type="text" placeholder="เช่น 12345" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>รหัสวิชา: *</label>
              <input type="text" placeholder="เช่น ค21101" value={formData.subjectCode} onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ชื่อวิชา: *</label>
              <input type="text" placeholder="เช่น คณิตศาสตร์" value={formData.subjectName} onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ติด: *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <option value="ศูนย์">ศูนย์</option>
                <option value="ร.">ร.</option>
                <option value="มส.">มส.</option>
                <option value="มพ.">มพ.</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ปี (พ.ศ.): *</label>
              <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>วันที่ส่ง: *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>รูปงานแก้: *</label>
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            {formData.images.length > 0 && (
              <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                {formData.images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={img} alt={`preview ${idx}`} style={{ width: '100%', height: '120px', objectFit: 'cover', border: '2px solid #ddd', borderRadius: '4px' }} />
                    <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" style={{ marginTop: '25px', padding: '12px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', width: '100%', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Upload size={18} /> ส่งงาน
          </button>
        </form>
      </div>
    );
  };

  const HistoryPage = () => {
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [localSearchType, setLocalSearchType] = useState('subject');
    
    const getFilteredSubmissions = () => {
      let filtered = getUserSubmissions();
      
      if (localSearchTerm) {
        filtered = filtered.filter(sub => {
          if (localSearchType === 'subject') {
            return sub.subjectName.toLowerCase().includes(localSearchTerm.toLowerCase());
          } else {
            return sub.subjectCode.toLowerCase().includes(localSearchTerm.toLowerCase());
          }
        });
      }
      
      return filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    };
    
    const userSubmissions = getFilteredSubmissions();
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const getStatusColor = (status) => {
      switch(status) {
        case 'ตรวจแล้ว': return '#4CAF50';
        case 'กำลังตรวจ': return '#2196F3';
        case 'ถูกลบ': return '#9E9E9E';
        default: return '#FFC107';
      }
    };

    return (
      <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>ประวัติการส่งงาน ({userSubmissions.length} งาน)</h2>
          <div>
            <button onClick={() => setPage('submit')} style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>ส่งงานใหม่</button>
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '25px', display: 'flex', gap: '10px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <select value={localSearchType} onChange={(e) => setLocalSearchType(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '180px' }}>
            <option value="subject">ค้นหาด้วยชื่อวิชา</option>
            <option value="code">ค้นหาด้วยรหัสวิชา</option>
          </select>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder={`ค้นหา${localSearchType === 'subject' ? 'ชื่อวิชา' : 'รหัสวิชา'}...`}
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 40px 10px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <Search size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          </div>
        </div>
        
        {userSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '18px', color: '#666' }}>
              {localSearchTerm ? 'ไม่พบงานที่ค้นหา' : 'ยังไม่มีประวัติการส่งงาน'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {userSubmissions.map(sub => (
              <div key={sub.id} style={{ border: '1px solid #ddd', padding: '20px', cursor: 'pointer', backgroundColor: sub.isDeleted ? '#f5f5f5' : 'white', borderRadius: '8px', transition: 'transform 0.2s', opacity: sub.isDeleted ? 0.7 : 1 }} onClick={() => setSelectedSubmission(sub)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>
                      {sub.subjectName} ({sub.subjectCode})
                      {sub.isDeleted && <span style={{ marginLeft: '10px', fontSize: '14px', color: '#9E9E9E' }}>อยู่ในถังขยะ</span>}
                    </h3>
                    <p style={{ margin: '5px 0', color: '#666' }}>ติด {sub.type} | ส่งเมื่อ {new Date(sub.submittedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p style={{ margin: '5px 0', color: '#666' }}>รูปงาน: {sub.images?.length || 0} รูป</p>
                    {sub.isDeleted && (
                      <p style={{ margin: '5px 0', color: '#f44336', fontSize: '13px' }}>
                        ถูกย้ายไปถังขยะเมื่อ: {new Date(sub.deletedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div style={{ padding: '8px 16px', backgroundColor: getStatusColor(sub.isDeleted ? 'ถูกลบ' : sub.status), color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                    {sub.isDeleted ? 'ถูกลบ' : sub.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedSubmission && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedSubmission(null)}>
            <div style={{ backgroundColor: 'white', padding: '30px', maxWidth: '700px', maxHeight: '85vh', overflow: 'auto', borderRadius: '8px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginTop: 0, borderBottom: '2px solid #4CAF50', paddingBottom: '10px' }}>รายละเอียดงาน</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div><strong>ชื่อ:</strong> {selectedSubmission.studentName}</div>
                <div><strong>ชั้น:</strong> {selectedSubmission.grade}</div>
                <div><strong>รหัสนักเรียน:</strong> {selectedSubmission.studentId}</div>
                <div><strong>รหัสวิชา:</strong> {selectedSubmission.subjectCode}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>ชื่อวิชา:</strong> {selectedSubmission.subjectName}</div>
                <div><strong>ติด:</strong> {selectedSubmission.type}</div>
                <div><strong>ปี:</strong> {selectedSubmission.year}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>วันที่ส่ง:</strong> {new Date(selectedSubmission.date).toLocaleDateString('th-TH')}</div>
                {selectedSubmission.completedAt && (
                  <div style={{ gridColumn: '1 / -1', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px' }}>
                    <strong>ตรวจเสร็จเมื่อ:</strong> {new Date(selectedSubmission.completedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>สถานะ:</strong> 
                  <span style={{ marginLeft: '10px', padding: '5px 12px', backgroundColor: getStatusColor(selectedSubmission.status), color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                    {selectedSubmission.status}
                  </span>
                </div>
              </div>
              
              {selectedSubmission.images && selectedSubmission.images.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <strong style={{ display: 'block', marginBottom: '10px' }}>รูปงาน ({selectedSubmission.images.length} รูป):</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {selectedSubmission.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => setViewImage(img)}
                      >
                        <img 
                          src={img} 
                          alt={`work ${idx + 1}`} 
                          style={{ width: '100%', height: '200px', objectFit: 'cover', border: '2px solid #ddd', borderRadius: '4px' }} 
                        />
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          padding: '8px',
                          borderRadius: '50%',
                          opacity: 0,
                          transition: 'opacity 0.3s',
                          pointerEvents: 'none'
                        }}
                        className="zoom-icon">
                          <ZoomIn size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setSelectedSubmission(null)} style={{ marginTop: '25px', padding: '12px 20px', width: '100%', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>ปิด</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AdminPage = () => {
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [localSearchType, setLocalSearchType] = useState('name');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmPermanentDelete, setConfirmPermanentDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [selectedStudent, setSelectedStudent] = useState(null); // เพิ่มสำหรับแสดง detail
    
    const getFilteredSubmissions = () => {
      const filtered = submissions.filter(sub => {
        // กรองตาม Tab
        if (activeTab === 'active' && sub.isDeleted) return false;
        if (activeTab === 'trash' && !sub.isDeleted) return false;
        
        // กรองตาม Search
        if (!localSearchTerm) return true;
        if (localSearchType === 'name') {
          return sub.userName.toLowerCase().includes(localSearchTerm.toLowerCase());
        } else {
          return sub.studentId.includes(localSearchTerm);
        }
      });

      const grouped = {};
      filtered.forEach(sub => {
        const key = sub.studentId;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(sub);
      });
      
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      });
      
      return grouped;
    };
    
    const groupedSubmissions = getFilteredSubmissions();
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [expandedCards, setExpandedCards] = useState({});

    const handleEdit = (submission) => {
      setEditingId(submission.id);
      setEditData(submission);
    };

    const handleSaveEdit = () => {
      updateSubmission(editingId, editData);
      setEditingId(null);
    };

    const handleDelete = (submissionId) => {
      deleteSubmission(submissionId);
      setConfirmDelete(null);
    };

    const handleRestore = (submissionId) => {
      restoreSubmission(submissionId);
    };

    const handlePermanentDelete = (submissionId) => {
      permanentDeleteSubmission(submissionId);
      setConfirmPermanentDelete(null);
    };

    const toggleCard = (studentId) => {
      setExpandedCards(prev => ({
        ...prev,
        [studentId]: !prev[studentId]
      }));
    };

    const getStatusColor = (status) => {
      switch(status) {
        case 'ตรวจแล้ว': return '#4CAF50';
        case 'กำลังตรวจ': return '#2196F3';
        default: return '#FFC107';
      }
    };

    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '32px', color: '#2c3e50' }}>Admin Panel</h2>
            <p style={{ margin: '8px 0 0 0', color: '#7f8c8d', fontSize: '15px' }}>
              นักเรียน: {Object.keys(getGroupedSubmissions()).length} คน | 
              งานทั้งหมด: {submissions.filter(s => !s.isDeleted).length} งาน | 
              ตรวจแล้ว: {submissions.filter(s => s.status === 'ตรวจแล้ว' && !s.isDeleted).length} งาน | 
              ถังขยะ: {submissions.filter(s => s.isDeleted).length} งาน
            </p>
          </div>
          <button onClick={handleLogout} style={{ 
            padding: '12px 24px', 
            backgroundColor: '#f44336', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '600',
            transition: 'all 0.3s',
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(244, 67, 54, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
          }}>
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('active')}
            style={{ 
              padding: '14px 28px', 
              backgroundColor: activeTab === 'active' ? '#4CAF50' : 'white', 
              color: activeTab === 'active' ? 'white' : '#7f8c8d',
              border: '2px solid ' + (activeTab === 'active' ? '#4CAF50' : '#e0e0e0'), 
              borderRadius: '10px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s',
              boxShadow: activeTab === 'active' ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'active') {
                e.target.style.borderColor = '#4CAF50';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'active') {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            งานที่ส่ง <span style={{ 
              backgroundColor: activeTab === 'active' ? 'rgba(255,255,255,0.3)' : '#e0e0e0', 
              padding: '2px 8px', 
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              {submissions.filter(s => !s.isDeleted).length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('trash')}
            style={{ 
              padding: '14px 28px', 
              backgroundColor: activeTab === 'trash' ? '#f44336' : 'white', 
              color: activeTab === 'trash' ? 'white' : '#7f8c8d',
              border: '2px solid ' + (activeTab === 'trash' ? '#f44336' : '#e0e0e0'), 
              borderRadius: '10px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s',
              boxShadow: activeTab === 'trash' ? '0 4px 12px rgba(244, 67, 54, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'trash') {
                e.target.style.borderColor = '#f44336';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'trash') {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <Trash size={18} /> ถังขยะ <span style={{ 
              backgroundColor: activeTab === 'trash' ? 'rgba(255,255,255,0.3)' : '#e0e0e0', 
              padding: '2px 8px', 
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              {submissions.filter(s => s.isDeleted).length}
            </span>
          </button>
        </div>
        <div style={{ marginBottom: '25px', display: 'flex', gap: '12px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <select value={localSearchType} onChange={(e) => setLocalSearchType(e.target.value)} style={{ 
            padding: '12px 16px', 
            border: '2px solid #e0e0e0', 
            borderRadius: '8px', 
            minWidth: '200px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}>
            <option value="name">ค้นหาด้วยชื่อ</option>
            <option value="id">ค้นหาด้วยรหัสนักเรียน</option>
          </select>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder={`ค้นหา${localSearchType === 'name' ? 'ชื่อนักเรียน' : 'รหัสนักเรียน'}...`}
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 45px 12px 16px', 
                border: '2px solid #e0e0e0', 
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'all 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            <Search size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#7f8c8d' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {Object.entries(groupedSubmissions).map(([studentId, subs], index) => {
            const isSelected = selectedStudent === studentId;
            
            return (
              <div 
                key={studentId} 
                style={{ 
                  border: '2px solid ' + (isSelected ? '#4CAF50' : '#e0e0e0'), 
                  padding: '20px', 
                  backgroundColor: 'white', 
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: isSelected ? '0 8px 24px rgba(76, 175, 80, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  }
                }}
                onClick={() => setSelectedStudent(isSelected ? null : studentId)}
              >
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2c3e50' }}>
                    {subs[0].studentName}
                  </h3>
                  <p style={{ color: '#7f8c8d', margin: '0', fontSize: '14px' }}>
                    รหัส: {studentId} | ชั้น: {subs[0].grade}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  padding: '12px', 
                  marginBottom: '12px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  fontSize: '15px'
                }}>
                  งานทั้งหมด: {subs.length} งาน
                </div>
                
                <button 
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: isSelected ? '#4CAF50' : '#f8f9fa', 
                    color: isSelected ? 'white' : '#2c3e50', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isSelected ? '▼ ซ่อนรายละเอียด' : '▶ ดูรายละเอียด'}
                </button>
                
                {/* Detail Section */}
                {isSelected && (
                  <div style={{ 
                    marginTop: '16px', 
                    animation: 'fadeIn 0.3s ease-out',
                    borderTop: '2px solid #f0f0f0',
                    paddingTop: '16px'
                  }}>
                    {subs.map((sub, idx) => (
                  <div key={sub.id} style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '16px', 
                    marginBottom: '12px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f4f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '10px', fontWeight: '600' }}>
                      งานที่ {subs.length - subs.indexOf(sub)} - {new Date(sub.submittedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    {editingId === sub.id ? (
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>ชื่อวิชา:</label>
                          <input type="text" value={editData.subjectName} onChange={(e) => setEditData({ ...editData, subjectName: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>รหัสวิชา:</label>
                          <input type="text" value={editData.subjectCode} onChange={(e) => setEditData({ ...editData, subjectCode: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>สถานะ:</label>
                          <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <option value="ยังไม่ตรวจ">ยังไม่ตรวจ</option>
                            <option value="กำลังตรวจ">กำลังตรวจ</option>
                            <option value="ตรวจแล้ว">ตรวจแล้ว</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={handleSaveEdit} style={{ flex: 1, padding: '8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Check size={16} /> บันทึก
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <X size={16} /> ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px' }}>
                        <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '15px', color: '#2c3e50' }}>{sub.subjectName}</p>
                        <p style={{ margin: '0 0 6px 0', color: '#7f8c8d', fontSize: '13px' }}>รหัสวิชา: {sub.subjectCode}</p>
                        <p style={{ margin: '0 0 12px 0', color: '#7f8c8d', fontSize: '13px' }}>ติด {sub.type} - ปี {sub.year}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '6px 14px', backgroundColor: getStatusColor(sub.status), color: 'white', fontSize: '12px', borderRadius: '6px', fontWeight: 'bold' }}>
                            {sub.status}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {activeTab === 'active' ? (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(sub); }} style={{ 
                                  padding: '8px 14px', 
                                  backgroundColor: '#2196F3', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '5px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#1976D2';
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#2196F3';
                                  e.target.style.transform = 'scale(1)';
                                }}>
                                  <Edit2 size={14} /> แก้ไข
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(sub.id); }} style={{ 
                                  padding: '8px 14px', 
                                  backgroundColor: '#f44336', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '5px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#d32f2f';
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#f44336';
                                  e.target.style.transform = 'scale(1)';
                                }}>
                                  <Trash2 size={14} /> ลบ
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleRestore(sub.id); }} style={{ 
                                  padding: '8px 14px', 
                                  backgroundColor: '#4CAF50', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '5px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#45a049';
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#4CAF50';
                                  e.target.style.transform = 'scale(1)';
                                }}>
                                  <RotateCcw size={14} /> กู้คืน
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setConfirmPermanentDelete(sub.id); }} style={{ 
                                  padding: '8px 14px', 
                                  backgroundColor: '#d32f2f', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '5px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#b71c1c';
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#d32f2f';
                                  e.target.style.transform = 'scale(1)';
                                }}>
                                  <Trash size={14} /> ลบถาวร
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {sub.images && sub.images.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#2c3e50' }}>
                              รูปงาน ({sub.images.length} รูป)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                              {sub.images.slice(0, 3).map((img, imgIdx) => (
                                <div 
                                  key={imgIdx}
                                  style={{ position: 'relative', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden' }}
                                  onClick={(e) => { e.stopPropagation(); setViewImage(img); }}
                                >
                                  <img 
                                    src={img} 
                                    alt={`work ${imgIdx + 1}`} 
                                    style={{ 
                                      width: '100%', 
                                      height: '70px', 
                                      objectFit: 'cover', 
                                      transition: 'all 0.3s'
                                    }} 
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                  />
                                </div>
                              ))}
                            </div>
                            {sub.images.length > 3 && (
                              <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '6px', textAlign: 'center' }}>
                                +{sub.images.length - 3} รูปเพิ่มเติม
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
                )}
            </div>
            );
          })}
        </div>
        {Object.keys(groupedSubmissions).length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            border: '2px dashed #e0e0e0',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>∅</div>
            <p style={{ fontSize: '18px', color: '#7f8c8d', margin: 0, fontWeight: '500' }}>
              {localSearchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีงานที่ส่งมา'}
            </p>
          </div>
        )}
        
        {/* Confirm Delete Modal */}
        {confirmDelete && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
              <h3 style={{ marginTop: 0, color: '#f44336' }}>ย้ายไปถังขยะ</h3>
              <p style={{ margin: '15px 0', color: '#666' }}>คุณต้องการย้ายงานนี้ไปถังขยะหรือไม่? คุณสามารถกู้คืนได้ภายหลัง</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => handleDelete(confirmDelete)} 
                  style={{ flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ย้ายไปถังขยะ
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)} 
                  style={{ flex: 1, padding: '10px', backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Confirm Permanent Delete Modal */}
        {confirmPermanentDelete && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', border: '3px solid #d32f2f' }}>
              <h3 style={{ marginTop: 0, color: '#d32f2f' }}>ลบถาวร</h3>
              <p style={{ margin: '15px 0', color: '#666', fontWeight: 'bold' }}>คำเตือน! การลบถาวรจะไม่สามารถกู้คืนได้อีก</p>
              <p style={{ margin: '10px 0', color: '#666' }}>คุณแน่ใจหรือไม่ที่จะลบงานนี้ออกจากระบบอย่างถาวร?</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => handlePermanentDelete(confirmPermanentDelete)} 
                  style={{ flex: 1, padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ลบถาวร
                </button>
                <button 
                  onClick={() => setConfirmPermanentDelete(null)} 
                  style={{ flex: 1, padding: '10px', backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <ImageViewer />
      <PopupNotification />
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .zoom-icon {
          opacity: 0 !important;
          transition: opacity 0.3s;
        }
        div:hover .zoom-icon {
          opacity: 1 !important;
        }
      `}</style>
      {!currentUser && <LoginPage />}
      {currentUser && !currentUser.isAdmin && page === 'submit' && <SubmitWorkPage />}
      {currentUser && !currentUser.isAdmin && page === 'history' && <HistoryPage />}
      {currentUser && currentUser.isAdmin && <AdminPage />}
    </div>
  );
};

export default App;