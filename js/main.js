document.addEventListener('DOMContentLoaded', () => {
    // Жёстко заданный адрес API
    const apiUrl = "http://192.168.1.141:8000";
    
    // Элементы интерфейса
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const strengthSlider = document.getElementById('strength');
    const strengthValue = document.getElementById('strength-value');
    const transformBtn = document.getElementById('transform-btn');
    const detectBtn = document.getElementById('detect-btn');
    const chainDetectBtn = document.getElementById('chain-detect-btn');
    const apiStatus = document.getElementById('api-status');
    
    // Проверка соединения с API при загрузке
    checkApiConnection();
    
    // Переключение вкладок
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Убираем класс active у всех вкладок
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Добавляем класс active активной вкладке
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Обновление отображения значения силы трансформации
    if (strengthSlider && strengthValue) {
        strengthSlider.addEventListener('input', () => {
            strengthValue.textContent = strengthSlider.value;
        });
    }
    
    // Обработчик для кнопки трансформации
    if (transformBtn) {
        transformBtn.addEventListener('click', async () => {
            const transformInput = document.getElementById('transform-input');
            const transformResult = document.getElementById('transform-result');
            const resultContainer = document.getElementById('result-container');
            
            if (!transformInput || !transformResult) return;
            
            const text = transformInput.value.trim();
            if (!text) {
                alert('Пожалуйста, введите текст для трансформации');
                return;
            }
            
            try {
                transformBtn.disabled = true;
                transformBtn.textContent = 'Трансформация...';
                
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
                transformResult.textContent = data.transformed_text;
                resultContainer.classList.remove('hidden');
                
                // Добавляем обработчик для копирования текста, если есть кнопка
                const copyBtn = document.getElementById('copy-transform-btn');
                if (copyBtn) {
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(transformResult.textContent)
                            .then(() => {
                                copyBtn.textContent = 'Скопировано!';
                                setTimeout(() => {
                                    copyBtn.textContent = 'Копировать';
                                }, 2000);
                            });
                    });
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при трансформации текста. Проверьте подключение к API.');
            } finally {
                transformBtn.disabled = false;
                transformBtn.textContent = 'Трансформировать';
            }
        });
    }
    
    // Обработчики для кнопок обнаружения
    if (detectBtn) {
        detectBtn.addEventListener('click', () => {
            processDetection('/detect');
        });
    }
    
    if (chainDetectBtn) {
        chainDetectBtn.addEventListener('click', () => {
            processDetection('/chain-detect');
        });
    }
    
    // Функция обработки запроса обнаружения
    async function processDetection(endpoint) {
        const detectInput = document.getElementById('detect-input');
        const detectResult = document.getElementById('detect-result');
        const detectResultContainer = document.getElementById('detect-result-container');
        
        if (!detectInput || !detectResult) return;
        
        const text = detectInput.value.trim();
        if (!text) {
            alert('Пожалуйста, введите текст для проверки');
            return;
        }
        
        try {
            detectBtn.disabled = true;
            chainDetectBtn.disabled = true;
            
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
            renderDetectionResult(data, detectResult);
            detectResultContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при проверке текста. Проверьте подключение к API.');
        } finally {
            detectBtn.disabled = false;
            chainDetectBtn.disabled = false;
        }
    }
    
    // Функция для отображения результата обнаружения
    function renderDetectionResult(data, resultElement) {
        const confidence = (data.confidence * 100).toFixed(1);
        const isAi = data.is_ai_generated;
        
        let html = `
            <div class="result-header ${isAi ? 'ai-detected' : 'human-text'}">
                <h4>${isAi ? 'Обнаружен AI-текст' : 'Вероятно, человеческий текст'}</h4>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                    <span>${confidence}% уверенность</span>
                </div>
            </div>
            <div class="details-container">
                <h4>Детали анализа:</h4>
                <ul>
        `;
        
        // Добавляем основные метрики
        if (data.details.lexical_diversity) {
            html += `<li>Лексическое разнообразие: ${(data.details.lexical_diversity * 100).toFixed(1)}%</li>`;
        }
        
        if (data.details.ai_patterns_ratio) {
            html += `<li>Доля AI-паттернов: ${(data.details.ai_patterns_ratio * 100).toFixed(1)}%</li>`;
        }
        
        // Добавляем информацию о структурных паттернах, если есть
        if (data.details.structural_patterns && data.details.structural_patterns.total_score) {
            html += `<li>Оценка структуры текста: ${(data.details.structural_patterns.total_score * 100).toFixed(1)}%</li>`;
        }
        
        // Добавляем когнитивную сложность и самоотсылки, если доступны
        if (data.details.cognitive_complexity) {
            html += `<li>Когнитивная сложность: ${(data.details.cognitive_complexity * 100).toFixed(1)}%</li>`;
        }
        
        if (data.details.self_reference) {
            html += `<li>Личные референции: ${(data.details.self_reference * 100).toFixed(1)}%</li>`;
        }
        
        // Добавляем информацию о корректировках, если это расширенный анализ
        if (data.details.chain_adjustments && data.details.chain_adjustments.applied) {
            html += `
                <li class="adjustment ${data.details.chain_adjustments.direction === 'повышена' ? 'increased' : 'decreased'}">
                    Оценка ${data.details.chain_adjustments.direction} на ${Math.abs(data.details.chain_adjustments.difference) * 100}% 
                    из-за: ${data.details.chain_adjustments.reasons.join(', ')}
                </li>
            `;
        }
        
        html += `
                </ul>
            </div>
        `;
        
        resultElement.innerHTML = html;
    }
    
    // Функция для проверки соединения с API
    function checkApiConnection() {
        fetch(`${apiUrl}/health`)
            .then(response => {
                if (response.ok) {
                    setApiStatus(true);
                } else {
                    setApiStatus(false);
                }
            })
            .catch(() => {
                setApiStatus(false);
            });
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
}); 
