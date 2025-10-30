import React, { useState, useEffect } from 'react';
import { Camera, Video, Trash2, Edit2, Share2, Facebook, Twitter, Instagram, Upload, X, Save, Heart, MessageCircle, Eye, Youtube } from 'lucide-react';

export default function PatagoniaCatsCMS() {
  const [posts, setPosts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [newComment, setNewComment] = useState({ name: '', text: '' });
  
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    location: '',
    catName: '',
    mediaType: 'image',
    mediaUrl: '',
    tags: ''
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const keys = await window.storage.list('cat-post:');
      if (keys && keys.keys) {
        const loadedPosts = await Promise.all(
          keys.keys.map(async (key) => {
            try {
              const result = await window.storage.get(key);
              return result ? JSON.parse(result.value) : null;
            } catch {
              return null;
            }
          })
        );
        setPosts(loadedPosts.filter(p => p !== null).sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.log('Iniciando con posts vacíos');
      setPosts([]);
    }
    setLoading(false);
  };

  const savePost = async (post) => {
    try {
      await window.storage.set(`cat-post:${post.id}`, JSON.stringify(post));
      await loadPosts();
      return true;
    } catch (error) {
      console.error('Error al guardar:', error);
      return false;
    }
  };

  const deletePost = async (postId) => {
    try {
      await window.storage.delete(`cat-post:${postId}`);
      await loadPosts();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const toggleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      const updatedPost = {
        ...post,
        likes: (post.likes || 0) + 1
      };
      await savePost(updatedPost);
    }
  };

  const addComment = async (postId) => {
    if (!newComment.name || !newComment.text) {
      alert('Por favor completa nombre y comentario');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (post) {
      const comment = {
        id: Date.now().toString(),
        name: newComment.name,
        text: newComment.text,
        timestamp: Date.now()
      };
      
      const updatedPost = {
        ...post,
        comments: [...(post.comments || []), comment]
      };
      
      await savePost(updatedPost);
      setNewComment({ name: '', text: '' });
    }
  };

  const deleteComment = async (postId, commentId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      const updatedPost = {
        ...post,
        comments: (post.comments || []).filter(c => c.id !== commentId)
      };
      await savePost(updatedPost);
    }
  };

  const incrementViews = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      const updatedPost = {
        ...post,
        views: (post.views || 0) + 1
      };
      await savePost(updatedPost);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    let videoId = null;
    
    if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('embed/')) {
      return url;
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.mediaUrl) {
      alert('Por favor completa título y URL de media');
      return;
    }

    const post = {
      id: Date.now().toString(),
      ...newPost,
      timestamp: Date.now(),
      likes: 0,
      shares: 0,
      views: 0,
      comments: []
    };

    const success = await savePost(post);
    if (success) {
      setShowAddModal(false);
      setNewPost({
        title: '',
        description: '',
        location: '',
        catName: '',
        mediaType: 'image',
        mediaUrl: '',
        tags: ''
      });
    }
  };

  const handleUpdatePost = async () => {
    if (editingPost) {
      const success = await savePost(editingPost);
      if (success) {
        setEditingPost(null);
      }
    }
  };

  const shareToSocial = async (post, platform) => {
    const updatedPost = {
      ...post,
      shares: (post.shares || 0) + 1
    };
    await savePost(updatedPost);

    const text = `🐱 ${post.title} - ${post.catName} desde ${post.location}, Patagonia`;
    const url = post.mediaUrl;
    
    let shareUrl = '';
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        alert('Instagram requiere compartir desde la app móvil. ¡Descarga la imagen primero!');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'images') return post.mediaType === 'image';
    if (filter === 'videos') return post.mediaType === 'video' || post.mediaType === 'youtube';
    return true;
  });

  const currentMediaType = editingPost ? editingPost.mediaType : newPost.mediaType;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-2xl text-blue-600">Cargando gatos patagónicos... 🐱</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-5xl">🐱</span>
              <div>
                <h1 className="text-3xl font-bold">Gatos de la Patagonia</h1>
                <p className="text-blue-100">Historias felinas del fin del mundo</p>
              </div>
            </div>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                isAdmin 
                  ? 'bg-yellow-400 text-gray-900' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isAdmin ? '👨‍💼 Modo Admin' : '👀 Modo Visitante'}
            </button>
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="bg-blue-600 text-white py-4">
          <div className="container mx-auto px-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center space-x-2"
            >
              <Upload size={20} />
              <span>Agregar Nueva Publicación</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex space-x-2 flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({posts.length})
            </button>
            <button
              onClick={() => setFilter('images')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center space-x-2 ${
                filter === 'images' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Camera size={18} />
              <span>Fotos ({posts.filter(p => p.mediaType === 'image').length})</span>
            </button>
            <button
              onClick={() => setFilter('videos')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center space-x-2 ${
                filter === 'videos' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Video size={18} />
              <span>Videos ({posts.filter(p => p.mediaType === 'video' || p.mediaType === 'youtube').length})</span>
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-8xl mb-4 block">😿</span>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No hay publicaciones aún</h2>
            <p className="text-gray-500">
              {isAdmin ? '¡Agrega la primera publicación de gatitos patagónicos!' : 'Vuelve pronto para ver gatitos adorables'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition">
                <div className="relative bg-gray-200 h-64">
                  {post.mediaType === 'youtube' ? (
                    <iframe
                      src={getYouTubeEmbedUrl(post.mediaUrl)}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => incrementViews(post.id)}
                    />
                  ) : post.mediaType === 'image' ? (
                    <img 
                      src={post.mediaUrl} 
                      alt={post.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => incrementViews(post.id)}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E🐱 Imagen%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <video 
                      src={post.mediaUrl} 
                      controls 
                      className="w-full h-full object-cover"
                      onPlay={() => incrementViews(post.id)}
                    />
                  )}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                    {post.mediaType === 'youtube' ? (
                      <>
                        <Youtube size={16} />
                        <span>YouTube</span>
                      </>
                    ) : post.mediaType === 'image' ? (
                      <>
                        <Camera size={16} />
                        <span>Foto</span>
                      </>
                    ) : (
                      <>
                        <Video size={16} />
                        <span>Video</span>
                      </>
                    )}
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-2">
                    <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <Eye size={14} />
                      <span>{post.views || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <span className="mr-2">🐾</span>
                    <span className="font-semibold">{post.catName}</span>
                    <span className="mx-2">•</span>
                    <span>📍 {post.location}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{post.description}</p>
                  
                  {post.tags && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.split(',').map((tag, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between py-3 border-t border-b my-3 text-gray-600 text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart size={16} className="text-red-500" />
                      <span>{post.likes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle size={16} className="text-blue-500" />
                      <span>{(post.comments || []).length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 size={16} className="text-green-500" />
                      <span>{post.shares || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition"
                      >
                        <Heart size={20} />
                        <span className="text-sm">Like</span>
                      </button>
                      <button 
                        onClick={() => setShowCommentsModal(post.id)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition"
                      >
                        <MessageCircle size={20} />
                        <span className="text-sm">Comentar</span>
                      </button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => shareToSocial(post, 'facebook')}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <Facebook size={18} />
                      </button>
                      <button 
                        onClick={() => shareToSocial(post, 'twitter')}
                        className="text-cyan-600 hover:text-cyan-800 transition"
                      >
                        <Twitter size={18} />
                      </button>
                      <button 
                        onClick={() => shareToSocial(post, 'instagram')}
                        className="text-pink-600 hover:text-pink-800 transition"
                      >
                        <Instagram size={18} />
                      </button>
                      
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setEditingPost(post)}
                            className="text-yellow-600 hover:text-yellow-800 transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta publicación?')) {
                                deletePost(post.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCommentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                  <MessageCircle size={24} />
                  <span>Comentarios</span>
                </h2>
                <button
                  onClick={() => setShowCommentsModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {(() => {
                  const post = posts.find(p => p.id === showCommentsModal);
                  const comments = post?.comments || [];
                  
                  if (comments.length === 0) {
                    return (
                      <p className="text-gray-500 text-center py-8">
                        No hay comentarios aún. ¡Sé el primero en comentar!
                      </p>
                    );
                  }
                  
                  return comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-800">{comment.name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.text}</p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este comentario?')) {
                                deleteComment(showCommentsModal, comment.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Agregar comentario</h3>
                <input
                  type="text"
                  value={newComment.name}
                  onChange={(e) => setNewComment({...newComment, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                  placeholder="Tu nombre"
                />
                <textarea
                  value={newComment.text}
                  onChange={(e) => setNewComment({...newComment, text: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Escribe tu comentario..."
                />
                <button
                  onClick={() => addComment(showCommentsModal)}
                  className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full"
                >
                  Publicar Comentario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAddModal || editingPost) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingPost ? 'Editar Publicación' : 'Nueva Publicación'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPost(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={editingPost ? editingPost.title : newPost.title}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({...editingPost, title: e.target.value});
                      } else {
                        setNewPost({...newPost, title: e.target.value});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Michi disfrutando la nieve"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Gato
                  </label>
                  <input
                    type="text"
                    value={editingPost ? editingPost.catName : newPost.catName}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({...editingPost, catName: e.target.value});
                      } else {
                        setNewPost({...newPost, catName: e.target.value});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Pelusa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ubicación en la Patagonia
                  </label>
                  <input
                    type="text"
                    value={editingPost ? editingPost.location : newPost.location}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({...editingPost, location: e.target.value});
                      } else {
                        setNewPost({...newPost, location: e.target.value});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Punta Arenas, Torres del Paine, Ushuaia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editingPost ? editingPost.description : newPost.description}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({...editingPost, description: e.target.value});
                      } else {
                        setNewPost({...newPost, description: e.target.value});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Cuenta la historia de este gatito..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Contenido
                  </label>
                  <div className="flex space-x-4 flex-wrap gap-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="image"
                        checked={currentMediaType === 'image'}
                        onChange={(e) => {
                          if (editingPost) {
                            setEditingPost({...editingPost, mediaType: e.target.value});
                          } else {
                            setNewPost({...newPost, mediaType: e.target.value});
                          }
                        }}
                        className="mr-2"
                      />
                      <Camera size={18} className="mr-1" />
                      Foto
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="video"
                        checked={currentMediaType === 'video'}
                        onChange={(e) => {
                          if (editingPost) {
                            setEditingPost({...editingPost, mediaType: e.target.value});
                          } else {
                            setNewPost({...newPost, mediaType: e.target.value});
                          }
                        }}
                        className="mr-2"
                      />
                      <Video size={18} className="mr-1" />
                      Video
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="youtube"
                        checked={currentMediaType === 'youtube'}
                        onChange={(e) => {
                          if (editingPost) {
                            setEditingPost({...editingPost, mediaType: e.target.value});
                          } else {
                            setNewPost({...newPost, mediaType: e.target.value});
                          }
                        }}
                        className="mr-2"
                      />
                      <Youtube size={18} className="mr-1" />
                      YouTube
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL de la {currentMediaType === 'youtube' ? 'Video de YouTube' : currentMediaType === 'image' ? 'Imagen' : 'Video'} *
                  </label>
                  <input
                    type="url"
                    value={editingPost ? editingPost.mediaUrl : newPost.mediaUrl}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({...editingPost, mediaUrl: e.target.value});
                      } else {
                        setNewPost({...newPost, mediaUrl: e.target.value});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      currentMediaType === 'youtube' 
                        ? 'https://www.youtube.com/watch?v=... o https://youtu.be/...'
                        : 'https://ejemplo.com/imagen-gato.jpg'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {currentMediaType === 'youtube' 
                      ? 'Pega aquí el enlace del video de YouTube' 
                      : 'Pega aquí la URL de tu imagen o video (desde Imgur, Google Drive, etc.)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Etiquetas (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={editingPost ? editingPost.tags : newPost.tags}
                    onChange={(e) => {
                      if (editingPost) {
                        setEditingPost({...editingPost, tags: e.target.value});
                      } else {
                        setNewPost({...newPost, tags: e.target.value});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="patagonia, gato, nieve, aventura"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={editingPost ? handleUpdatePost : handleAddPost}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                  >
                    <Save size={20} />
                    <span>{editingPost ? 'Actualizar' : 'Publicar'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingPost(null);
                    }}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg mb-2">🐱 Gatos de la Patagonia</p>
          <p className="text-gray-400 text-sm mb-4">
            Compartiendo las historias de nuestros amigos felinos del fin del mundo
          </p>
          <div className="flex justify-center space-x-6">
            <Facebook className="cursor-pointer hover:text-blue-400 transition" />
            <Twitter className="cursor-pointer hover:text-cyan-400 transition" />
            <Instagram className="cursor-pointer hover:text-pink-400 transition" />
            <Youtube className="cursor-pointer hover:text-red-400 transition" />
          </div>
        </div>
      </footer>
    </div>
  );
}