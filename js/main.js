document.addEventListener('DOMContentLoaded', () => {
    // Жёстко заданный адрес API
    const apiUrl = "http://192.168.1.141:8000";
    
    // Элементы интерфейса
    const transformForm = document.getElementById('transformForm');
    const detectForm = document.getElementById('detectForm');
    const strengthSlider = document.getElementById('transformStrength');
    const strengthValue = document.getElementById('strengthValue');
    const apiStatus = document.getElementById('api-status');
    const setupApiBtn = document.getElementById('setup-api-btn');
    
    // Добавляем стили для статусов, если они еще не добавлены
    addStatusStyles();
    
    // Проверка соединения с API при загрузке с расширенной индикацией
    checkApiConnectionWithTimeout();
    
    // Обработчик кнопки настройки API (можно скрыть, т.к. мы используем жёстко заданный URL)
    if (setupApiBtn) {
        setupApiBtn.style.display = 'none'; // Скрываем кнопку настройки, так как адрес жёстко задан
    }
    
    // Обновление отображения значения силы трансформации
    if (strengthSlider && strengthValue) {
        strengthSlider.addEventListener('input', () => {
            strengthValue.textContent = strengthSlider.value;
        });
    }
    
    // Обработчик формы трансформации
    if (transformForm) {
        transformForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const aiText = document.getElementById('aiText');
            const transformedText = document.getElementById('transformedText');
            const transformResult = document.getElementById('transformResult');
            const transformBtn = transformForm.querySelector('button[type="submit"]');
            
            if (!aiText || !transformedText) return;
            
            const text = aiText.value.trim();
            if (!text) {
                showToast('Пожалуйста, введите текст для трансформации', false);
            return;
        }
        
            try {
                // Блокируем кнопку и меняем текст
                transformBtn.disabled = true;
                transformBtn.textContent = 'Трансформация...';
                
                // Проверяем соединение перед выполнением
                const connectionStatus = await checkApiConnectionQuick();
                if (!connectionStatus) {
                    throw new Error('API недоступен');
                }
                
                const response = await fetch(`${apiUrl}/transform`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                        text: text,
                        strength: parseFloat(strengthSlider.value)
                })
            });
            
            if (!response.ok) {
                    throw new Error('Ошибка при трансформации текста');
            }
            
            const data = await response.json();
            transformedText.textContent = data.transformed_text;
            transformResult.classList.remove('d-none');
                
                showToast('Текст успешно трансформирован!', true);
                
                // Добавляем обработчик для копирования текста
                const copyBtn = document.getElementById('copyTransformed');
                if (copyBtn) {
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(transformedText.textContent)
                            .then(() => {
                                copyBtn.textContent = 'Скопировано!';
                setTimeout(() => {
                                    copyBtn.textContent = 'Копировать';
                }, 2000);
                            });
                    };
                }
                
                // Добавляем обработчик для проверки трансформированного текста
                const detectTransformedBtn = document.getElementById('detectTransformed');
                if (detectTransformedBtn) {
                    detectTransformedBtn.onclick = () => {
                        const checkText = document.getElementById('checkText');
                        if (checkText) {
                            checkText.value = transformedText.textContent;
                            // Переключаемся на вкладку проверки
                            const detectLink = document.querySelector('a[href="#detect"]');
                            if (detectLink) detectLink.click();
                        }
                    };
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showToast(`Ошибка: ${error.message}`, false);
            } finally {
                transformBtn.disabled = false;
                transformBtn.textContent = 'Трансформировать';
            }
        });
    }
    
    // Обработчик формы детекции
    if (detectForm) {
        detectForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const checkText = document.getElementById('checkText');
            const detectResult = document.getElementById('detectResult');
            const confidenceLevel = document.getElementById('confidenceLevel');
            const resultAlert = document.getElementById('resultAlert');
            const aiProbability = document.getElementById('aiProbability');
            const detailsContainer = document.getElementById('detailsContainer');
            const useChainDetection = document.getElementById('useChainDetection');
            const detectBtn = detectForm.querySelector('button[type="submit"]');
            
            if (!checkText || !detectResult || !confidenceLevel || !aiProbability) return;
            
            const text = checkText.value.trim();
            if (!text) {
                showToast('Пожалуйста, введите текст для проверки', false);
                return;
            }
            
            try {
                // Блокируем кнопку
                detectBtn.disabled = true;
                detectBtn.textContent = 'Проверка...';
                
                // Проверяем соединение перед выполнением
                const connectionStatus = await checkApiConnectionQuick();
                if (!connectionStatus) {
                    throw new Error('API недоступен');
                }
                
                // Определяем, какой эндпоинт использовать
                const endpoint = useChainDetection && useChainDetection.checked ? '/chain-detect' : '/detect';
                
                const response = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                        text: text,
                        strength: 0.5
                })
            });
            
            if (!response.ok) {
                    throw new Error('Ошибка при проверке текста');
            }
            
            const data = await response.json();
                const confidence = (data.confidence * 100).toFixed(1);
                const isAi = data.is_ai_generated;
                
                // Обновляем результаты
                detectResult.classList.remove('d-none');
                confidenceLevel.style.width = `${confidence}%`;
                
                // Обновляем текст результата
                if (isAi) {
                    resultAlert.className = 'alert mb-3 alert-danger';
                    aiProbability.textContent = `Вероятность того, что текст создан AI: ${confidence}%. Текст, вероятно, сгенерирован искусственным интеллектом.`;
                } else {
                    resultAlert.className = 'alert mb-3 alert-success';
                    aiProbability.textContent = `Вероятность того, что текст создан AI: ${confidence}%. Текст, вероятно, написан человеком.`;
                }
                
                // Обновляем результаты цепочного анализа, если доступны
                if (data.details.chain_adjustments && data.details.chain_adjustments.applied) {
                    const originalConfidence = document.getElementById('originalConfidence');
                    const chainAdjustedConfidence = document.getElementById('chainAdjustedConfidence');
                    const chainAnalysisResult = document.getElementById('chainAnalysisResult');
                    
                    if (originalConfidence && chainAdjustedConfidence && chainAnalysisResult) {
                        const originalConf = (data.confidence - data.details.chain_adjustments.difference) * 100;
                        originalConfidence.textContent = originalConf.toFixed(1);
                        chainAdjustedConfidence.textContent = confidence;
                        chainAnalysisResult.classList.remove('d-none');
                    }
                }
                
                // Обновляем детализацию
                if (detailsContainer) {
                    detailsContainer.innerHTML = '';
                    
                    // Добавляем данные о лексическом разнообразии
                    if (data.details.lexical_diversity !== undefined) {
                        addFeatureRow(detailsContainer, 'Лексическое разнообразие', data.details.lexical_diversity);
                    }
                    
                    // Добавляем данные о доле AI-паттернов
                    if (data.details.ai_patterns_ratio !== undefined) {
                        addFeatureRow(detailsContainer, 'Доля AI-паттернов', data.details.ai_patterns_ratio);
                    }
                    
                    // Добавляем информацию о структуре текста
                    if (data.details.structural_patterns && data.details.structural_patterns.total_score !== undefined) {
                        addFeatureRow(detailsContainer, 'Оценка структуры текста', data.details.structural_patterns.total_score);
                    }
                    
                    // Добавляем когнитивную сложность, если доступна
                    if (data.details.cognitive_complexity !== undefined) {
                        addFeatureRow(detailsContainer, 'Когнитивная сложность', data.details.cognitive_complexity);
                    }
                    
                    // Добавляем личные референции, если доступны
                    if (data.details.self_reference !== undefined) {
                        addFeatureRow(detailsContainer, 'Личные референции', data.details.self_reference);
                    }
                    
                    // Добавляем перплексию, если доступна
                    if (data.details.perplexity !== undefined) {
                        addFeatureRow(detailsContainer, 'Перплексия (предсказуемость)', data.details.perplexity, true);
                    }
                    
                    // Добавляем бурстичность, если доступна
                    if (data.details.burstiness !== undefined) {
                        addFeatureRow(detailsContainer, 'Бурстичность', data.details.burstiness, true);
                    }
                }
                
                showToast('Анализ текста завершен!', true);
        } catch (error) {
            console.error('Ошибка:', error);
                showToast(`Ошибка: ${error.message}`, false);
        } finally {
                detectBtn.disabled = false;
                detectBtn.textContent = 'Проверить';
            }
        });
    }
    
    // Функция для добавления строки с характеристикой в детализацию
    function addFeatureRow(container, name, value, isNew = false) {
        const valuePercent = (value * 100).toFixed(1);
        let barClass = 'medium';
        
        if (valuePercent > 75) {
            barClass = 'high';
        } else if (valuePercent < 30) {
            barClass = 'low';
        }
        
        const featureRow = document.createElement('div');
        featureRow.className = 'feature-row';
        featureRow.innerHTML = `
            <div class="feature-name">${name}${isNew ? '<span class="new-feature-badge small">НОВОЕ</span>' : ''}</div>
            <div class="feature-value">
                <div class="mini-meter">
                    <div class="mini-bar ${barClass}" style="width: ${valuePercent}%"></div>
                </div>
                <span>${valuePercent}%</span>
            </div>
        `;
        
        container.appendChild(featureRow);
    }
    
    // Функция для проверки соединения с API с таймаутом
    function checkApiConnectionWithTimeout() {
        if (apiStatus) {
            apiStatus.textContent = 'Проверка соединения...';
            apiStatus.className = 'status-connecting';
        }
        
        // Устанавливаем таймаут на 5 секунд
        const timeoutId = setTimeout(() => {
            if (apiStatus) {
                apiStatus.textContent = 'API не отвечает';
                apiStatus.className = 'status-offline';
                showToast('API не отвечает по адресу: ' + apiUrl, false);
            }
        }, 5000);
        
        fetch(`${apiUrl}/health`)
            .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) {
                    setApiStatus(true);
                    showToast('Соединение с API установлено!', true);
                } else {
                    setApiStatus(false);
                    showToast('Сервер API вернул ошибку', false);
                }
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                setApiStatus(false);
                showToast('Не удалось подключиться к API: ' + error.message, false);
            });
    }
    
    // Быстрая проверка соединения без уведомлений и с коротким таймаутом
    async function checkApiConnectionQuick() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(`${apiUrl}/health`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.error("Быстрая проверка соединения: ", error);
            return false;
        }
    }
    
    // Функция для установки статуса API
    function setApiStatus(isConnected) {
        if (apiStatus) {
            if (isConnected) {
                apiStatus.textContent = 'API подключен';
                apiStatus.className = 'status-online';
            } else {
                apiStatus.textContent = 'API не подключен';
                apiStatus.className = 'status-offline';
            }
        }
    }
    
    // Функция для показа уведомлений
    function showToast(message, isSuccess) {
        // Удаляем предыдущие уведомления
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            document.body.removeChild(toast);
        });
        
        const toast = document.createElement('div');
        toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.zIndex = '1000';
        
        if (isSuccess) {
            toast.style.backgroundColor = '#d4edda';
            toast.style.color = '#155724';
            toast.style.border = '1px solid #c3e6cb';
        } else {
            toast.style.backgroundColor = '#f8d7da';
            toast.style.color = '#721c24';
            toast.style.border = '1px solid #f5c6cb';
        }
        
        document.body.appendChild(toast);
        
        // Показываем уведомление
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // Добавление стилей для статусов
    function addStatusStyles() {
        // Проверяем, существует ли уже элемент стилей с нашим ID
        if (!document.getElementById('api-status-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'api-status-styles';
            styleEl.textContent = `
                .status-online {
                    color: #00a651;
                    font-weight: bold;
                    background: #e6f7ef;
                    padding: 5px 10px;
                    border-radius: 4px;
                    border-left: 4px solid #00a651;
                }
                
                .status-offline {
                    color: #e74c3c;
                    font-weight: bold;
                    background: #fae9e7;
                    padding: 5px 10px;
                    border-radius: 4px;
                    border-left: 4px solid #e74c3c;
                }
                
                .status-connecting {
                    color: #3498db;
                    font-weight: bold;
                    background: #e7f4fc;
                    padding: 5px 10px;
                    border-radius: 4px;
                    border-left: 4px solid #3498db;
                }
                
                .status-unknown {
                    color: #7f8c8d;
                    font-weight: bold;
                    background: #f4f6f6;
                    padding: 5px 10px;
                    border-radius: 4px;
                    border-left: 4px solid #7f8c8d;
                }
                
                .api-status-container {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 1000;
                    background: white;
                    padding: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(styleEl);
        }
    }
    
    // Периодическая проверка соединения каждые 30 секунд
    setInterval(checkApiConnectionQuick, 30000);
}); 
