document.addEventListener('DOMContentLoaded', function() {
    // Обработка формы трансформации
    const transformForm = document.getElementById('transformForm');
    const strengthSlider = document.getElementById('transformStrength');
    const strengthValue = document.getElementById('strengthValue');
    const transformResult = document.getElementById('transformResult');
    const transformedText = document.getElementById('transformedText');
    const copyBtn = document.getElementById('copyTransformed');
    const detectTransformedBtn = document.getElementById('detectTransformed');
    
    // Обработка формы проверки на AI
    const detectForm = document.getElementById('detectForm');
    const detectResult = document.getElementById('detectResult');
    const aiProbability = document.getElementById('aiProbability');
    const resultAlert = document.getElementById('resultAlert');
    const detailsContainer = document.getElementById('detailsContainer');
    const confidenceLevel = document.getElementById('confidenceLevel');
    const useChainDetection = document.getElementById('useChainDetection');
    const chainAnalysisResult = document.getElementById('chainAnalysisResult');
    const originalConfidence = document.getElementById('originalConfidence');
    const chainAdjustedConfidence = document.getElementById('chainAdjustedConfidence');
    
    // Обработка формы цепочного детектирования
    const chainDetectForm = document.getElementById('chainDetectForm');
    const chainDetectResult = document.getElementById('chainDetectResult');
    const chainAiProbability = document.getElementById('chainAiProbability');
    const chainResultAlert = document.getElementById('chainResultAlert');
    const chainDetailsContainer = document.getElementById('chainDetailsContainer');
    const chainConfidenceLevel = document.getElementById('chainConfidenceLevel');
    
    // В начале файла добавьте переменные для работы с API
    const apiStatus = document.getElementById('api-status');
    const setupApiBtn = document.getElementById('setup-api-btn');
    const apiSetupModal = document.getElementById('api-setup-modal');
    const apiUrlInput = document.getElementById('api-url');
    const saveApiUrlBtn = document.getElementById('save-api-url');
    const closeModalBtn = document.querySelector('.close-btn');
    
    // Настройки API
    let apiUrl = localStorage.getItem('apiUrl') || '';
    checkApiConnection();
    
    // Обновление значения силы трансформации
    strengthSlider.addEventListener('input', function() {
        strengthValue.textContent = this.value;
    });
    
    // Отправка формы трансформации
    transformForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const aiText = document.getElementById('aiText').value.trim();
        if (!aiText) {
            alert('Пожалуйста, введите текст для трансформации');
            return;
        }
        
        const strength = parseFloat(strengthSlider.value);
        
        // Показать индикатор загрузки
        transformForm.querySelector('button').disabled = true;
        transformForm.querySelector('button').innerHTML = 'Обработка...';
        
        try {
            const response = await fetch('/transform', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: aiText,
                    strength: strength
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Отображение результата
            transformedText.textContent = data.transformed_text;
            transformResult.classList.remove('d-none');
            transformResult.classList.add('show');
            
            // Прокрутка к результату
            transformResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при трансформации текста. Пожалуйста, попробуйте еще раз.');
        } finally {
            // Вернуть кнопку в исходное состояние
            transformForm.querySelector('button').disabled = false;
            transformForm.querySelector('button').innerHTML = 'Трансформировать';
        }
    });
    
    // Копирование трансформированного текста
    copyBtn.addEventListener('click', function() {
        const textToCopy = transformedText.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = this.textContent;
                this.textContent = 'Скопировано!';
                
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Ошибка при копировании:', err);
            });
    });
    
    // Кнопка "Проверить результат" для трансформированного текста
    if (detectTransformedBtn) {
        detectTransformedBtn.addEventListener('click', function() {
            const text = transformedText.textContent;
            if (text) {
                // Заполняем поле проверки трансформированным текстом
                document.getElementById('checkText').value = text;
                
                // Прокручиваем к форме проверки
                document.getElementById('detect').scrollIntoView({ behavior: 'smooth' });
                
                // Автоматически запускаем проверку после небольшой задержки
                setTimeout(() => {
                    detectForm.dispatchEvent(new Event('submit'));
                }, 500);
            }
        });
    }
    
    // Отображение подробностей анализа
    function displayFeatureDetails(features, container) {
        container.innerHTML = '';
        
        // Создаем таблицу деталей
        const featureNames = {
            "formality_score": "Формальность текста",
            "sentence_diversity": "Разнообразие предложений",
            "ai_patterns_count": "Характерные AI-паттерны",
            "style_consistency": "Консистентность стиля",
            "lexical_diversity": "Лексическое разнообразие",
            "informal_particles_score": "Неформальные частицы",
            "sentence_length_variance": "Вариативность длин предложений",
            "error_score": "Наличие опечаток и ошибок",
            "cliche_phrases_score": "Шаблонные фразы",
            "repetition_score": "Повторяемость",
            "unusual_phrasing_score": "Необычные перефразировки",
            "emotional_diversity_score": "Эмоциональное разнообразие",
            "predictability_score": "Предсказуемость",
            "internet_match_score": "Совпадение с интернет-текстами",
            "perplexity_score": "Перплексия (предсказуемость)",
            "burstiness_score": "Бурстичность (разнообразие)"
        };
        
        // Сортируем особенности по их влиянию на определение AI
        const sortedFeatures = Object.entries(features)
            .filter(([key]) => key in featureNames)
            .sort((a, b) => b[1] - a[1]);
        
        for (const [feature, value] of sortedFeatures) {
            const featureRow = document.createElement('div');
            featureRow.className = 'feature-row';
            
            const featureName = document.createElement('div');
            featureName.className = 'feature-name';
            featureName.textContent = featureNames[feature] || feature;
            
            // Добавляем метку "НОВОЕ" для новых функций
            if (feature === "perplexity_score" || feature === "burstiness_score") {
                const newBadge = document.createElement('span');
                newBadge.className = 'new-feature-badge small';
                newBadge.textContent = 'НОВОЕ';
                featureName.appendChild(newBadge);
            }
            
            const featureValue = document.createElement('div');
            featureValue.className = 'feature-value';
            
            // Создаем миниатюрный индикатор для каждой характеристики
            const miniMeter = document.createElement('div');
            miniMeter.className = 'mini-meter';
            
            const percentValue = value * 100;
            const miniBar = document.createElement('div');
            miniBar.className = 'mini-bar';
            miniBar.style.width = `${percentValue}%`;
            
            // Выбираем цвет в зависимости от значения
            if (percentValue > 75) {
                miniBar.classList.add('high');
            } else if (percentValue > 40) {
                miniBar.classList.add('medium');
            } else {
                miniBar.classList.add('low');
            }
            
            miniMeter.appendChild(miniBar);
            
            const percentText = document.createElement('span');
            percentText.textContent = `${percentValue.toFixed(1)}%`;
            
            featureValue.appendChild(miniMeter);
            featureValue.appendChild(percentText);
            
            featureRow.appendChild(featureName);
            featureRow.appendChild(featureValue);
            container.appendChild(featureRow);
        }
        
        // Добавляем подсказку о том, что означают эти показатели
        const hintRow = document.createElement('div');
        hintRow.className = 'mt-3 text-muted small';
        hintRow.innerHTML = 'Высокие значения указывают на вероятность AI-генерации. Самые значимые показатели отображаются первыми.';
        container.appendChild(hintRow);
    }
    
    // Отправка формы проверки на AI
    detectForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const checkText = document.getElementById('checkText').value.trim();
        if (!checkText) {
            alert('Пожалуйста, введите текст для проверки');
            return;
        }
        
        // Показать индикатор загрузки
        detectForm.querySelector('button').disabled = true;
        detectForm.querySelector('button').innerHTML = 'Проверка...';
        
        try {
            // Определяем, нужно ли использовать цепочный анализ
            const useChain = useChainDetection && useChainDetection.checked;
            
            // Выбираем соответствующий эндпоинт
            const endpoint = useChain ? '/chain-detect' : '/detect';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: checkText,
                    strength: 0.5 // Для совместимости с API
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Определяем базовую уверенность для отображения
            const confidence = data.confidence * 100;
            const isAI = data.is_ai_generated;
            
            // Добавляем ai_score для отображения в индикаторе
            data.details.ai_score = data.confidence;
            
            // Задаем цвет и текст результата
            let alertClass, resultText;
            
            if (isAI) {
                if (confidence > 85) {
                    alertClass = 'alert-danger';
                    resultText = `С высокой вероятностью (${confidence.toFixed(1)}%) текст создан искусственным интеллектом.`;
                } else {
                    alertClass = 'alert-warning';
                    resultText = `Вероятно (${confidence.toFixed(1)}%), текст создан искусственным интеллектом.`;
                }
            } else {
                alertClass = 'alert-success';
                resultText = `Вероятность того, что текст создан AI: ${confidence.toFixed(1)}%. Скорее всего, текст написан человеком.`;
            }
            
            resultAlert.className = 'alert mb-3 ' + alertClass;
            aiProbability.innerHTML = resultText;
            
            // Показываем/скрываем блок с результатами цепочного анализа
            if (useChain && data.original_confidence !== undefined) {
                // Это результат от цепочного анализа
                originalConfidence.textContent = (data.original_confidence * 100).toFixed(1);
                chainAdjustedConfidence.textContent = (data.chain_confidence * 100).toFixed(1);
                chainAnalysisResult.classList.remove('d-none');
            } else {
                chainAnalysisResult.classList.add('d-none');
            }
            
            // Анимированное отображение уровня уверенности
            confidenceLevel.style.width = '0%';
            
            // Отображение подробностей анализа
            displayFeatureDetails(data.details, detailsContainer);
            
            // Показываем блок с результатами
            detectResult.classList.remove('d-none');
            
            // Анимация показателя уверенности
            setTimeout(() => {
                confidenceLevel.style.width = `${confidence}%`;
            }, 100);
            
            // Прокрутка к результату
            detectResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при проверке текста. Пожалуйста, попробуйте еще раз.');
        } finally {
            // Вернуть кнопку в исходное состояние
            detectForm.querySelector('button').disabled = false;
            detectForm.querySelector('button').innerHTML = 'Проверить';
        }
    });
    
    // Отправка формы цепочного детектирования
    chainDetectForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const checkText = document.getElementById('chainCheckText').value.trim();
        if (!checkText) {
            alert('Пожалуйста, введите текст для цепочной проверки');
            return;
        }
        
        // Показать индикатор загрузки
        chainDetectForm.querySelector('button').disabled = true;
        chainDetectForm.querySelector('button').innerHTML = 'Выполняется анализ...';
        
        try {
            const response = await fetch('/chain-detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: checkText,
                    strength: 0.5 // Для совместимости с API
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Отображение результата
            const confidence = data.confidence * 100;
            const isAI = data.is_ai_generated;
            
            // Заполняем информацию о базовом и цепочном результатах
            originalConfidence.textContent = (data.original_confidence * 100).toFixed(1);
            chainAdjustedConfidence.textContent = (data.chain_confidence * 100).toFixed(1);
            
            // Добавляем ai_score для отображения в индикаторе
            data.details.ai_score = data.confidence;
            
            // Задаем цвет и текст результата
            let alertClass, resultText;
            
            if (isAI) {
                if (confidence > 85) {
                    alertClass = 'alert-danger';
                    resultText = `С высокой вероятностью (${confidence.toFixed(1)}%) текст создан искусственным интеллектом.`;
                } else {
                    alertClass = 'alert-warning';
                    resultText = `Вероятно (${confidence.toFixed(1)}%), текст создан искусственным интеллектом.`;
                }
            } else {
                alertClass = 'alert-success';
                resultText = `Вероятность того, что текст создан AI: ${confidence.toFixed(1)}%. Скорее всего, текст написан человеком.`;
            }
            
            chainResultAlert.className = 'alert mb-3 ' + alertClass;
            chainAiProbability.innerHTML = resultText;
            
            // Анимированное отображение уровня уверенности
            chainConfidenceLevel.style.width = '0%';
            // Отображение подробностей анализа
            displayFeatureDetails(data.details, chainDetailsContainer);
            
            chainDetectResult.classList.remove('d-none');
            
            // Анимация показателя уверенности
            setTimeout(() => {
                chainConfidenceLevel.style.width = `${confidence}%`;
            }, 100);
            
            // Прокрутка к результату
            chainDetectResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при цепочной проверке текста. Пожалуйста, попробуйте еще раз.');
        } finally {
            // Вернуть кнопку в исходное состояние
            chainDetectForm.querySelector('button').disabled = false;
            chainDetectForm.querySelector('button').innerHTML = 'Запустить цепочный анализ';
        }
    });
    
    // Обработка переходов по вкладкам
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Удаляем класс active у всех ссылок
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Добавляем класс active текущей ссылке
            this.classList.add('active');
            
            // Переходим к соответствующему разделу
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Обработчики событий для API
    setupApiBtn.addEventListener('click', () => {
        apiUrlInput.value = apiUrl;
        apiSetupModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        apiSetupModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === apiSetupModal) {
            apiSetupModal.classList.add('hidden');
        }
    });

    saveApiUrlBtn.addEventListener('click', () => {
        apiUrl = apiUrlInput.value.trim();
        localStorage.setItem('apiUrl', apiUrl);
        apiSetupModal.classList.add('hidden');
        checkApiConnection();
    });

    // Функция для проверки соединения с API
    function checkApiConnection() {
        if (!apiUrl) {
            setApiStatus(false);
            return;
        }
        
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
        if (isConnected) {
            apiStatus.textContent = 'API подключен';
            apiStatus.className = 'status-online';
        } else {
            apiStatus.textContent = 'API не подключен';
            apiStatus.className = 'status-offline';
        }
    }

    // Функция для отображения ошибки API
    function showApiError() {
        alert('Необходимо настроить подключение к API. Нажмите "Настроить API" и введите адрес вашего локального сервера.');
    }
}); 