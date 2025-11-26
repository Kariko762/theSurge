import React, { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import '../../styles/AdminCompact.css';

/**
 * Image Pool Manager
 * Manage pools of images for different content types (POIs, events, items, etc.)
 * Images stored on backend as actual files
 */
const ImagePoolManager = () => {
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDescription, setNewPoolDescription] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from backend
  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3002/api/image-pools');
      const data = await response.json();
      if (data.success) {
        setPools(data.pools || []);
      }
    } catch (error) {
      console.error('Failed to load image pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPool = async () => {
    if (!newPoolName.trim()) return;

    try {
      const response = await fetch('http://localhost:3002/api/image-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPoolName,
          description: newPoolDescription
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadPools();
        setIsCreatingPool(false);
        setNewPoolName('');
        setNewPoolDescription('');
        setSelectedPool(data.pool);
      }
    } catch (error) {
      console.error('Failed to create pool:', error);
      alert('Failed to create pool: ' + error.message);
    }
  };

  const deletePool = async (poolId) => {
    if (!confirm('Delete this image pool? All images will be removed.')) return;

    try {
      const response = await fetch(`http://localhost:3002/api/image-pools/${poolId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await loadPools();
        if (selectedPool?.id === poolId) {
          setSelectedPool(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete pool:', error);
      alert('Failed to delete pool: ' + error.message);
    }
  };

  const handleImageUpload = async (poolId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`http://localhost:3002/api/image-pools/${poolId}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        await loadPools();
        // Update selected pool
        const updatedPools = await fetch('http://localhost:3002/api/image-pools').then(r => r.json());
        if (updatedPools.success) {
          setSelectedPool(updatedPools.pools.find(p => p.id === poolId));
        }
      } else {
        alert('Failed to upload image: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const deleteImage = async (poolId, imageId) => {
    if (!confirm('Delete this image?')) return;

    try {
      const response = await fetch(`http://localhost:3002/api/image-pools/${poolId}/images/${imageId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await loadPools();
        // Update selected pool
        const updatedPools = await fetch('http://localhost:3002/api/image-pools').then(r => r.json());
        if (updatedPools.success) {
          setSelectedPool(updatedPools.pools.find(p => p.id === poolId));
        }
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image: ' + error.message);
    }
  };

  const exportPool = (pool) => {
    const dataStr = JSON.stringify(pool, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `image_pool_${pool.id}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Loading image pools...
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '1.5rem',
      padding: '1.5rem',
      minHeight: 'calc(100vh - 120px)'
    }}>
      {/* LEFT: Pool List */}
      <div style={{
        background: 'rgba(0, 15, 25, 0.6)',
        border: '1px solid rgba(52, 224, 255, 0.3)',
        borderRadius: '6px',
        padding: '1rem',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(52, 224, 255, 0.05)',
        height: 'fit-content'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(52, 224, 255, 0.2)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '0.9rem',
            color: '#34e0ff',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Image Pools
          </h3>
          <button
            onClick={() => setIsCreatingPool(true)}
            style={{
              background: 'rgba(52, 224, 255, 0.15)',
              border: '1px solid rgba(52, 224, 255, 0.4)',
              borderRadius: '4px',
              padding: '0.3rem 0.6rem',
              color: '#34e0ff',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            + NEW
          </button>
        </div>

        {/* Create Pool Form */}
        {isCreatingPool && (
          <div style={{
            background: 'rgba(0, 40, 60, 0.4)',
            border: '1px solid rgba(52, 224, 255, 0.3)',
            borderRadius: '4px',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              placeholder="Pool Name"
              value={newPoolName}
              onChange={(e) => setNewPoolName(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 20, 30, 0.8)',
                border: '1px solid rgba(52, 224, 255, 0.3)',
                borderRadius: '3px',
                padding: '0.5rem',
                color: '#cfd8df',
                fontSize: '0.8rem',
                marginBottom: '0.5rem'
              }}
            />
            <textarea
              placeholder="Description"
              value={newPoolDescription}
              onChange={(e) => setNewPoolDescription(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 20, 30, 0.8)',
                border: '1px solid rgba(52, 224, 255, 0.3)',
                borderRadius: '3px',
                padding: '0.5rem',
                color: '#cfd8df',
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={createPool}
                style={{
                  flex: 1,
                  background: 'rgba(0, 255, 136, 0.2)',
                  border: '1px solid rgba(0, 255, 136, 0.5)',
                  borderRadius: '3px',
                  padding: '0.4rem',
                  color: '#00ff88',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingPool(false);
                  setNewPoolName('');
                  setNewPoolDescription('');
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255, 80, 80, 0.1)',
                  border: '1px solid rgba(255, 80, 80, 0.5)',
                  borderRadius: '3px',
                  padding: '0.4rem',
                  color: '#ff5050',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Pool List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pools.map(pool => (
            <div
              key={pool.id}
              onClick={() => setSelectedPool(pool)}
              style={{
                background: selectedPool?.id === pool.id 
                  ? 'rgba(52, 224, 255, 0.15)' 
                  : 'rgba(0, 30, 45, 0.3)',
                border: selectedPool?.id === pool.id
                  ? '1px solid rgba(52, 224, 255, 0.6)'
                  : '1px solid rgba(52, 224, 255, 0.2)',
                borderRadius: '4px',
                padding: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedPool?.id !== pool.id) {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPool?.id !== pool.id) {
                  e.currentTarget.style.background = 'rgba(0, 30, 45, 0.3)';
                }
              }}
            >
              <div style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#34e0ff',
                marginBottom: '0.25rem'
              }}>
                {pool.name}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: '#7ab8c4',
                marginBottom: '0.5rem'
              }}>
                {pool.description}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  color: '#666',
                  background: 'rgba(52, 224, 255, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '3px'
                }}>
                  {pool.images.length} images
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePool(pool.id);
                  }}
                  style={{
                    background: 'rgba(255, 80, 80, 0.1)',
                    border: '1px solid rgba(255, 80, 80, 0.4)',
                    borderRadius: '3px',
                    padding: '0.2rem 0.5rem',
                    color: '#ff5050',
                    fontSize: '0.65rem',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Pool Details */}
      {selectedPool ? (
        <div style={{
          background: 'rgba(0, 15, 25, 0.6)',
          border: '1px solid rgba(52, 224, 255, 0.3)',
          borderRadius: '6px',
          padding: '1.5rem',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(52, 224, 255, 0.05)'
        }}>
          {/* Pool Header */}
          <div style={{
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(52, 224, 255, 0.2)'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.2rem',
              color: '#34e0ff',
              marginBottom: '0.5rem'
            }}>
              {selectedPool.name}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: '#7ab8c4',
              marginBottom: '1rem'
            }}>
              {selectedPool.description}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{
                background: 'rgba(52, 224, 255, 0.15)',
                border: '1px solid rgba(52, 224, 255, 0.4)',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                color: '#34e0ff',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                + Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(selectedPool.id, e)}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                onClick={() => exportPool(selectedPool)}
                style={{
                  background: 'rgba(0, 204, 255, 0.1)',
                  border: '1px solid rgba(0, 204, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  color: '#00ccff',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Export Pool
              </button>
            </div>
          </div>

          {/* Image Grid */}
          {selectedPool.images.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {selectedPool.images.map(image => (
                <div
                  key={image.id}
                  style={{
                    background: 'rgba(0, 30, 45, 0.4)',
                    border: '1px solid rgba(52, 224, 255, 0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.6)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(52, 224, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img
                    src={`http://localhost:3002${image.url}`}
                    alt={image.originalName || image.name}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#cfd8df',
                      marginBottom: '0.5rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {image.originalName || image.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.65rem',
                        color: '#666'
                      }}>
                        {(image.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        onClick={() => deleteImage(selectedPool.id, image.id)}
                        style={{
                          background: 'rgba(255, 80, 80, 0.1)',
                          border: '1px solid rgba(255, 80, 80, 0.4)',
                          borderRadius: '3px',
                          padding: '0.25rem 0.5rem',
                          color: '#ff5050',
                          fontSize: '0.65rem',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#666'
            }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>No images in this pool yet</p>
              <p style={{ fontSize: '0.75rem' }}>Upload images using the button above</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(0, 15, 25, 0.6)',
          border: '1px solid rgba(52, 224, 255, 0.3)',
          borderRadius: '6px',
          padding: '3rem',
          textAlign: 'center',
          color: '#666',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(52, 224, 255, 0.05)'
        }}>
          <p style={{ fontSize: '0.9rem' }}>Select an image pool to manage</p>
        </div>
      )}
    </div>
  );
};

export default ImagePoolManager;
