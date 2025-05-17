/**
 * API Service for Etkinlik Yönetim Sistemi
 * 
 * This file provides a centralized service for all API calls to the backend.
 * It handles authentication, API requests, and common error handling.
 */

// Base API URL
const API_URL = 'http://127.0.0.1:8000';

// API Service object
const ApiService = {
    /**
     * Get the authentication token from localStorage
     * @returns {string|null} Authentication token or null if not authenticated
     */
    getToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Set the authentication token in localStorage
     * @param {string} token - Authentication token
     */
    setToken(token) {
        localStorage.setItem('authToken', token);
    },

    /**
     * Remove the authentication token from localStorage
     */
    removeToken() {
        localStorage.removeItem('authToken');
    },

    /**
     * Check if the user is authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Create the request headers
     * @param {boolean} requiresAuth - Whether the request requires authentication
     * @returns {Object} Headers object
     */
    createHeaders(requiresAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (requiresAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }
        }

        return headers;
    },

    /**
     * Process API response
     * @param {Response} response - Fetch API response
     * @returns {Promise} Promise that resolves to the response data
     */
    async processResponse(response) {
        // For 204 No Content responses
        if (response.status === 204) {
            return { success: true };
        }

        // Try to parse JSON
        let data;
        try {
            data = await response.json();
        } catch (error) {
            // Return text if not JSON
            const text = await response.text();
            if (text) {
                data = { message: text };
            } else {
                data = { message: 'No response data' };
            }
        }

        // Check if response is successful
        if (!response.ok) {
            const error = new Error(data.error || data.detail || data.message || 'API error');
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    },

    /**
     * Perform an API request
     * @param {string} url - API endpoint URL
     * @param {string} method - HTTP method (GET, POST, etc.)
     * @param {Object} data - Request data (body)
     * @param {boolean} requiresAuth - Whether the request requires authentication
     * @returns {Promise} Promise that resolves to the response data
     */
    async request(url, method = 'GET', data = null, requiresAuth = false) {
        const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
        
        const options = {
            method,
            headers: this.createHeaders(requiresAuth)
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`API ${method} Request:`, fullUrl);
            const response = await fetch(fullUrl, options);
            const result = await this.processResponse(response);
            console.log(`API ${method} Response:`, result);
            return result;
        } catch (error) {
            console.error(`API ${method} Error:`, error);
            throw error;
        }
    },

    /**
     * Perform a GET request
     * @param {string} url - API endpoint URL
     * @param {boolean} requiresAuth - Whether the request requires authentication
     * @returns {Promise} Promise that resolves to the response data
     */
    get(url, requiresAuth = false) {
        return this.request(url, 'GET', null, requiresAuth);
    },

    /**
     * Perform a POST request
     * @param {string} url - API endpoint URL
     * @param {Object} data - Request data (body)
     * @param {boolean} requiresAuth - Whether the request requires authentication
     * @returns {Promise} Promise that resolves to the response data
     */
    post(url, data, requiresAuth = false) {
        return this.request(url, 'POST', data, requiresAuth);
    },

    /**
     * Perform a PUT request
     * @param {string} url - API endpoint URL
     * @param {Object} data - Request data (body)
     * @param {boolean} requiresAuth - Whether the request requires authentication
     * @returns {Promise} Promise that resolves to the response data
     */
    put(url, data, requiresAuth = false) {
        return this.request(url, 'PUT', data, requiresAuth);
    },

    /**
     * Perform a DELETE request
     * @param {string} url - API endpoint URL
     * @param {boolean} requiresAuth - Whether the request requires authentication
     * @returns {Promise} Promise that resolves to the response data
     */
    delete(url, requiresAuth = false) {
        return this.request(url, 'DELETE', null, requiresAuth);
    },

    // AUTH API
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} Promise that resolves to the response data
     */
    register(userData) {
        return this.post('/api/users/register/', userData);
    },

    /**
     * Login a user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise} Promise that resolves to the response data with auth token
     */
    login(username, password) {
        return this.post('/api/users/login/', { username, password });
    },

    /**
     * Logout the current user
     */
    logout() {
        this.removeToken();
    },

    /**
     * Kullanıcı çıkış işlemi (logout)
     * @returns {Promise<void>}
     */
    async cikisYap() {
        try {
            // Eğer backend'de bir logout endpoint'iniz varsa:
            await this.post('/api/users/logout/', {}, true);
        } catch (e) {
            // Hata olsa bile token silinsin
        }
        this.removeToken();
    },

    /**
     * Change user's password
     * @param {string} username - The user's username
     * @param {string} newPassword - The new password
     * @returns {Promise} Promise that resolves to the response data
     */
    changePassword(username, newPassword) {
        return this.post('/api/users/change-password/', { 
            username: username,
            new_password: newPassword 
        }, true);
    },

    /**
     * Reset forgotten password
     * @param {string} username - The user's username
     * @param {string} newPassword - The new password
     * @returns {Promise} Promise that resolves to the response data
     */
    resetPassword(username, newPassword) {
        return this.post('/api/users/reset-password/', { 
            username: username,
            new_password: newPassword 
        });
    },

    /**
     * Get the current user's profile
     * @returns {Promise} Promise that resolves to the user data
     */
    getCurrentUser() {
        return this.get('/api/users/me/', true);
    },

    /**
     * Update the current user's profile
     * @param {Object} userData - User profile data to update
     * @returns {Promise} Promise that resolves to the updated user data
     */
    updateCurrentUser(userData) {
        return this.put('/api/users/me/', userData, true);
    },

    // EVENTS API
    /**
     * Get all events
     * @param {Object} filters - Optional filters for events
     * @returns {Promise} Promise that resolves to the events data
     */
    getEvents(filters = {}) {
        // Convert filters object to URL query parameters
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value);
            }
        });

        const queryString = queryParams.toString();
        const url = `/api/events/events/${queryString ? `?${queryString}` : ''}`;
        
        return this.get(url);
    },

    /**
     * Get a specific event by ID
     * @param {number} eventId - Event ID
     * @returns {Promise} Promise that resolves to the event data
     */
    getEvent(eventId) {
        return this.get(`/api/events/events/${eventId}/`)
            .catch(error => {
                if (error.status === 404) {
                    console.warn(`Etkinlik ${eventId} için yeni API yolu çalışmadı, eski yol deneniyor`);
                    return this.get(`/api/events/${eventId}/`);
                }
                throw error;
            })
            .then(responseData => {
                console.log(`Etkinlik verisi alındı (ID: ${eventId}):`, responseData);
                
                // API'den gelen veriyi kontrol et ve düzenle
                if (responseData) {
                    if (responseData.results && Array.isArray(responseData.results) && responseData.results.length > 0) {
                        console.log('API yanıtı "results" içinde dönüş yaptı - ilk sonuç kullanılıyor');
                        return responseData.results[0];
                    } else if (Array.isArray(responseData) && responseData.length > 0) {
                        console.log('API yanıtı dizi olarak döndü - ilk eleman kullanılıyor');
                        return responseData[0];
                    } else if (typeof responseData === 'object' && (responseData.id || responseData.title)) {
                        console.log('API yanıtı direkt etkinlik nesnesi döndü');
                        return responseData;
                    }
                }
                
                // Hiçbir formatta veri bulunamadıysa orijinal yanıtı döndür
                return responseData;
            });
    },

    /**
     * Create a new event
     * @param {Object} eventData - Event data
     * @returns {Promise} Promise that resolves to the created event data
     */
    createEvent(eventData) {
        return this.post('/api/events/events/', eventData, true);
    },

    /**
     * Update an event
     * @param {number} eventId - Event ID
     * @param {Object} eventData - Event data to update
     * @returns {Promise} Promise that resolves to the updated event data
     */
    updateEvent(eventId, eventData) {
        return this.put(`/api/events/events/${eventId}/`, eventData, true);
    },

    /**
     * Delete an event
     * @param {number} eventId - Event ID
     * @returns {Promise} Promise that resolves when the event is deleted
     */
    deleteEvent(eventId) {
        return this.delete(`/api/events/events/${eventId}/`, true);
    },

    /**
     * Register for an event
     * @param {number} eventId - Event ID
     * @param {Object} registrationData - Registration data
     * @returns {Promise} Promise that resolves to the registration data
     */
    registerForEvent(eventId, registrationData) {
        return this.post(`/api/events/events/${eventId}/register/`, registrationData, true);
    },

    /**
     * Add a comment to an event
     * @param {number} eventId - Event ID
     * @param {Object} commentData - Comment data
     * @returns {Promise} Promise that resolves to the comment data
     */
    addEventComment(eventId, commentData) {
        return this.post(`/api/events/events/${eventId}/add_comment/`, commentData, true);
    },

    // CATEGORIES API
    /**
     * Get all event categories
     * @returns {Promise} Promise that resolves to the categories data
     */
    getCategories() {
        return this.get('/api/events/categories/');
    },

    // REGISTRATIONS API
    /**
     * Get user's event registrations
     * @returns {Promise} Promise that resolves to the registrations data
     */
    getUserRegistrations() {
        return this.get('/api/users/registrations/', true)
            .then(async registrations => {
                console.log('Ham bilet verileri:', registrations);
                
                // Biletlerde etkinlik detayları eksikse, event_id'leri toplayıp etkinlik detaylarını getir
                if (Array.isArray(registrations) && registrations.length > 0) {
                    // Biletleri kontrol edelim ve event_id'leri toplayalım
                    const eventIds = [];
                    const ticketsWithoutDates = [];
                    const enrichedTickets = [];
                    
                    registrations.forEach((ticket, index) => {
                        // start_date alanını spesifik olarak kontrol et (event.start_date tercih edilir)
                        const hasEventDate = 
                            (ticket.event && ticket.event.start_date) || 
                            ticket.start_date || 
                            ticket.event_date;
                        
                        if (!hasEventDate && (ticket.event_id || ticket.event?.id)) {
                            // Etkinlik tarihi yoksa detay getir
                            const eventId = ticket.event_id || ticket.event?.id;
                            if (!eventIds.includes(eventId)) {
                                eventIds.push(eventId);
                            }
                            ticketsWithoutDates.push({ticketIndex: index, eventId});
                        } else {
                            // Tarih bilgisi olan biletleri direkt zenginleştirilmiş listeye ekle
                            enrichedTickets[index] = ticket;
                        }
                    });
                    
                    console.log('Tarih verisi eksik biletler:', ticketsWithoutDates);
                    console.log('İstek yapılacak etkinlik ID\'leri:', eventIds);
                    
                    // Eksik etkinlik bilgilerini getir
                    if (eventIds.length > 0) {
                        try {
                            // Paralel olarak tüm eksik etkinlik bilgilerini getir
                            const eventDetailsPromises = eventIds.map(id => this.getEvent(id));
                            const eventDetailsList = await Promise.all(eventDetailsPromises);
                            
                            console.log('Alınan etkinlik detayları:', eventDetailsList);
                            
                            // Etkinlik detaylarını ilgili biletlere ekle
                            ticketsWithoutDates.forEach(ticket => {
                                const eventDetail = eventDetailsList.find(
                                    detail => detail && (detail.id == ticket.eventId)
                                );
                                
                                if (eventDetail) {
                                    const originalTicket = registrations[ticket.ticketIndex];
                                    
                                    // Etkinlik bilgilerini birleştir
                                    enrichedTickets[ticket.ticketIndex] = {
                                        ...originalTicket,
                                        event: {
                                            ...(originalTicket.event || {}),
                                            ...eventDetail,
                                            id: ticket.eventId
                                        }
                                    };
                                    
                                    console.log(`Bilet #${ticket.ticketIndex} için etkinlik detayları eklendi`);
                                    
                                    // Özellikle start_date kontrolü yapalım
                                    if (eventDetail.start_date) {
                                        console.log(`Etkinlik ${ticket.eventId} için start_date bulundu: ${eventDetail.start_date}`);
                                    } else {
                                        console.warn(`Etkinlik ${ticket.eventId} için start_date bulunamadı!`);
                                    }
                                } else {
                                    enrichedTickets[ticket.ticketIndex] = registrations[ticket.ticketIndex];
                                    console.warn(`ID ${ticket.eventId} için etkinlik detayı bulunamadı`);
                                }
                            });
                            
                            // Boş indeksler varsa temizle
                            const finalTickets = enrichedTickets.filter(ticket => ticket !== undefined);
                            console.log('Zenginleştirilmiş bilet verileri:', finalTickets);
                            
                            return finalTickets;
                        } catch (error) {
                            console.error('Etkinlik detayları getirilirken hata oluştu:', error);
                        }
                    }
                }
                
                // Herhangi bir işlem yapılmadıysa orijinal verileri döndür
                return registrations;
            });
    },

    /**
     * Kullanıcının biletlerini hem kayıtlar API'si hem de etkinlikler API'sinden tarihları alarak zenginleştirir
     * @returns {Promise} Promise that resolves to the enhanced registrations data with event dates
     */
    getEnhancedUserRegistrations() {
        // Önce tüm etkinlikleri getir
        return this.getEvents()
            .then(events => {
                // Tüm etkinlikler için bir harita oluştur (isim -> tarih)
                const eventTitleToDateMap = {};
                const eventIdToDateMap = {};
                
                // API yanıtını normalize et
                const allEvents = Array.isArray(events) ? events : (events.results || []);
                
                // Tüm etkinlikleri işle ve isimlerine göre tarih bilgisini sakla
                allEvents.forEach(event => {
                    if (event.title && event.start_date) {
                        // Başlığı küçük harfe çevirerek normalleştir
                        const normalizedTitle = event.title.trim().toLowerCase();
                        eventTitleToDateMap[normalizedTitle] = event.start_date;
                        
                        // ID'ye göre de sakla
                        if (event.id) {
                            eventIdToDateMap[event.id] = event.start_date;
                        }
                    }
                });
                
                console.log('Etkinlik başlıkları -> tarihleri eşleşmesi:', eventTitleToDateMap);
                console.log('Etkinlik ID -> tarihleri eşleşmesi:', eventIdToDateMap);
                
                // Sonra kullanıcı kayıtlarını getir
                return this.getUserRegistrations()
                    .then(registrations => {
                        // Kayıtlar API'si boş veya hatalıysa boş dizi döndür
                        if (!registrations || !Array.isArray(registrations)) {
                            return [];
                        }
                        
                        // Her bilet için en doğru tarih bilgisini bulmaya çalış
                        return registrations.map(ticket => {
                            // Eğer bilet zaten start_date içeriyorsa dokunma
                            if (ticket.event?.start_date) {
                                return ticket;
                            }
                            
                            // Etkinlik ID'si üzerinden tarihi bulmaya çalış
                            const eventId = ticket.event_id || ticket.event?.id;
                            if (eventId && eventIdToDateMap[eventId]) {
                                // ID'ye göre tarih bulunduysa ekle
                                return {
                                    ...ticket,
                                    event: {
                                        ...(ticket.event || {}),
                                        start_date: eventIdToDateMap[eventId]
                                    }
                                };
                            }
                            
                            // Etkinlik ismine göre tarihi bulmaya çalış
                            const eventTitle = ticket.event?.title || ticket.event_title || ticket.event_name;
                            if (eventTitle) {
                                const normalizedTitle = eventTitle.trim().toLowerCase();
                                if (eventTitleToDateMap[normalizedTitle]) {
                                    // İsme göre tarih bulunduysa ekle
                                    return {
                                        ...ticket,
                                        event: {
                                            ...(ticket.event || {}),
                                            start_date: eventTitleToDateMap[normalizedTitle]
                                        }
                                    };
                                }
                            }
                            
                            // Hiçbir eşleşme bulunamadıysa olduğu gibi döndür
                            return ticket;
                        });
                    });
            })
            .catch(error => {
                console.error('Zenginleştirilmiş bilet verileri alınırken hata oluştu:', error);
                // Hata durumunda standart kayıtları getir
                return this.getUserRegistrations();
            });
    },

    // DUYURU API
    /**
     * Get active announcements
     * @returns {Promise} Promise that resolves to the announcements data
     */
    getAnnouncements() {
        return this.get('/api/events/duyurular/');
    },

    // STATISTICS API
    /**
     * Get event statistics (admin only)
     * @returns {Promise} Promise that resolves to the statistics data
     */
    getEventStatistics() {
        return this.get('/api/events/statistics/', true);
    },

    // File upload helper
    /**
     * Upload a file
     * @param {string} url - API endpoint URL
     * @param {FormData} formData - Form data with file
     * @returns {Promise} Promise that resolves to the response data
     */
    async uploadFile(url, formData) {
        const token = this.getToken();
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }
        
        const response = await fetch(`${API_URL}${url}`, {
            method: 'POST',
            headers,
            body: formData
        });
        
        return this.processResponse(response);
    }
};

// Export the API service
window.ApiService = ApiService;