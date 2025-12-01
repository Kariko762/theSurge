import React, { useState } from 'react';
import NarrativeLibrary from './NarrativeLibrary.jsx';
import ImagePoolManager from './ImagePoolManager.jsx';
import UITemplate from './UITemplate.jsx';
import '../../styles/AdminCompact.css';

/**
 * Content Library - Central hub for managing all game content
 * Narratives, Images, Videos, Audio, etc.
 */

const ContentLibrary = ({ config, updateConfig }) => {
  const [activeTab, setActiveTab] = useState('narratives');

  const tabs = [
    { id: 'narratives', label: 'Narratives', icon: '📝' },
    { id: 'images', label: 'Image Pools', icon: '🖼️' },
    { id: 'ui', label: 'UI', icon: '🎨' },
    { id: 'videos', label: 'Videos', icon: '🎬', disabled: true },
    { id: 'audio', label: 'Audio', icon: '🔊', disabled: true }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgba(0, 5, 10, 0.95)',
      padding: '0'
    }}>
      {/* Content Library Header - Sci-Fi Terminal Style */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(0, 20, 30, 0.9) 0%, rgba(0, 10, 20, 0.8) 100%)',
        borderBottom: '2px solid rgba(52, 224, 255, 0.4)',
        padding: '1rem 1.5rem',
        boxShadow: '0 0 20px rgba(52, 224, 255, 0.15), inset 0 1px 0 rgba(52, 224, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '4px',
            height: '30px',
            background: 'linear-gradient(180deg, #34e0ff 0%, rgba(52, 224, 255, 0.2) 100%)',
            boxShadow: '0 0 10px rgba(52, 224, 255, 0.6)'
          }} />
          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            color: '#34e0ff',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            textShadow: '0 0 15px rgba(52, 224, 255, 0.8), 0 0 30px rgba(52, 224, 255, 0.4)'
          }}>
            CONTENT LIBRARY
          </h2>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(52, 224, 255, 0.4) 0%, rgba(52, 224, 255, 0) 100%)'
          }} />
        </div>

        {/* Sub-tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1.2rem',
                background: activeTab === tab.id 
                  ? 'rgba(52, 224, 255, 0.2)' 
                  : tab.disabled 
                    ? 'rgba(30, 30, 30, 0.3)'
                    : 'rgba(0, 40, 60, 0.4)',
                border: activeTab === tab.id
                  ? '1px solid rgba(52, 224, 255, 0.8)'
                  : '1px solid rgba(52, 224, 255, 0.2)',
                borderRadius: '4px',
                color: tab.disabled ? '#555' : activeTab === tab.id ? '#34e0ff' : '#7ab8c4',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab.id 
                  ? '0 0 12px rgba(52, 224, 255, 0.3), inset 0 0 10px rgba(52, 224, 255, 0.1)' 
                  : 'none',
                opacity: tab.disabled ? 0.4 : 1
              }}
              onMouseEnter={(e) => {
                if (!tab.disabled && activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!tab.disabled && activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(0, 40, 60, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.2)';
                }
              }}
            >
              {tab.label}
              {tab.disabled && <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>(Coming Soon)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'narratives' && <NarrativeLibrary config={config} updateConfig={updateConfig} />}
        {activeTab === 'images' && <ImagePoolManager />}
        {activeTab === 'narratives' && <NarrativeLibrary config={config} updateConfig={updateConfig} />}
        {activeTab === 'images' && <ImagePoolManager />}
        {activeTab === 'ui' && <UITemplate />}
        {activeTab === 'videos' && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <h3>Video Library</h3>
            <p>Coming soon...</p>
          </div>
        )}
        {activeTab === 'audio' && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <h3>Audio Library</h3>
            <p>Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentLibrary;
