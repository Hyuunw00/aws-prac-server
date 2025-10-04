import React, { useState, useEffect } from 'react';
import type { Image } from '../types';
import { imageApi } from '../services/api';

export const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchImages = async () => {
    try {
      setError(null);
      const response = await imageApi.getAll();
      if (response.success) {
        setImages(response.images);
      } else {
        setError('이미지를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to fetch images:', error);
      setError(error.response?.data?.error || '서버 연결에 실패했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    
    try {
      const filesArray = Array.from(files);
      const response = await imageApi.upload(filesArray);
      
      if (response.success) {
        setSuccess(`${response.count}개의 이미지가 업로드되었습니다!`);
        fetchImages();
        // Reset input
        e.target.value = '';
      } else {
        setError(response.error || '업로드에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to upload:', error);
      setError(error.response?.data?.error || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpdate = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    try {
      const response = await imageApi.update(id, file);
      if (response.success) {
        setSuccess('이미지가 수정되었습니다!');
        fetchImages();
        // Reset input
        e.target.value = '';
      } else {
        setError(response.error || '수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to update:', error);
      setError(error.response?.data?.error || '수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 이미지를 정말 삭제하시겠습니까?`)) return;

    setError(null);
    
    try {
      const response = await imageApi.delete(id);
      if (response.success) {
        setSuccess('이미지가 삭제되었습니다.');
        fetchImages();
      } else {
        setError(response.error || '삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to delete:', error);
      setError(error.response?.data?.error || '삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">이미지를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <div className="gallery-header">
        <h1>🎨 Image Gallery</h1>
        <p className="subtitle">AWS S3와 연동된 이미지 갤러리</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          ✅ {success}
        </div>
      )}
      
      <div className="upload-section">
        <div className="upload-area">
          <label className="upload-button">
            <span className="upload-icon">📤</span>
            {uploading ? '업로드 중...' : '이미지 업로드'}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>
          <p style={{ marginTop: '15px', color: '#7f8c8d', fontSize: '14px' }}>
            여러 이미지를 동시에 선택할 수 있습니다
          </p>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📸</div>
          <h2 className="empty-title">아직 이미지가 없습니다</h2>
          <p className="empty-text">첫 번째 이미지를 업로드해보세요!</p>
        </div>
      ) : (
        <div className="images-grid">
          {images.map((image) => (
            <div key={image.id} className="image-card">
              <div className="image-wrapper">
                <img 
                  src={image.url} 
                  alt={image.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTUwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjE5cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
              <div className="image-info">
                <p className="image-name" title={image.name}>📁 {image.name}</p>
                <p className="image-date">📅 {formatDate(image.createdAt)}</p>
                <div className="image-actions">
                  <label className="update-btn">
                    <span>🔄</span> 수정
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpdate(image.id, e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(image.id, image.name)}
                  >
                    <span>🗑️</span> 삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};