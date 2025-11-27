# 🌍 Guía de Internacionalización (i18n)

Sistema multi-idioma implementado con **react-i18next** para Fund8.

---

## 📚 **IDIOMAS DISPONIBLES**

- 🇪🇸 **Español** (es) - Por defecto
- 🇺🇸 **Inglés** (en)
- 🇧🇷 **Portugués** (pt)
- 🇸🇦 **Árabe** (ar) - Con soporte RTL

---

## 🎯 **CÓMO USAR EN TUS COMPONENTES**

### **1. Importar el hook `useTranslation`**

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.app_name')}</h1>
      <button>{t('common.confirm')}</button>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
}
```

### **2. Acceder a las traducciones**

Las traducciones están organizadas por categorías:

```javascript
// Común
t('common.loading')          // "Cargando..." / "Loading..." / "Carregando..."
t('common.error')            // "Error"
t('common.success')          // "Éxito" / "Success" / "Sucesso"

// Navegación
t('nav.dashboard')           // "Dashboard" / "Dashboard" / "Painel"
t('nav.trading')             // "Trading" / "Trading" / "Negociação"
t('nav.my_wallet')           // "Mi Billetera" / "My Wallet" / "Minha Carteira"

// Trading
t('trading.buy')             // "Comprar" / "Buy" / "Comprar"
t('trading.sell')            // "Vender" / "Sell" / "Vender"
t('trading.price')           // "Precio" / "Price" / "Preço"

// Wallet
t('wallet.balance')          // "Balance" / "Balance" / "Saldo"
t('wallet.connect_wallet')   // "Conectar Billetera" / "Connect Wallet" / "Conectar Carteira"

// Dashboard
t('dashboard.total_assets')  // "Activos Totales" / "Total Assets" / "Ativos Totais"

// WebSocket
t('websocket.connected')     // "WebSocket Conectado" / "WebSocket Connected"
t('websocket.real_time')     // "Tiempo Real" / "Real-time" / "Tempo Real"

// Notificaciones
t('notifications.order_placed')  // "Orden colocada exitosamente"
```

---

## 🔧 **SELECTOR DE IDIOMA**

Ya está integrado en el **Header** (arriba a la derecha).

### **Para agregar en otros lugares:**

#### Estilo Compacto (solo bandera):
```javascript
import LanguageSelector from '../components/LanguageSelector';

<LanguageSelector variant="compact" />
```

#### Estilo Completo (con texto):
```javascript
<LanguageSelector />
// o
<LanguageSelector variant="default" />
```

---

## 📝 **EJEMPLOS DE USO**

### **Ejemplo 1: Botón Simple**

```javascript
import { useTranslation } from 'react-i18next';

function MyButton() {
  const { t } = useTranslation();
  
  return (
    <button className="btn btn-primary">
      {t('trading.buy')}
    </button>
  );
}
```

### **Ejemplo 2: Formulario**

```javascript
import { useTranslation } from 'react-i18next';

function OrderForm() {
  const { t } = useTranslation();
  
  return (
    <form>
      <label>{t('trading.price')}</label>
      <input placeholder={t('trading.price')} />
      
      <label>{t('trading.amount')}</label>
      <input placeholder={t('trading.amount')} />
      
      <button type="submit">
        {t('trading.place_order')}
      </button>
    </form>
  );
}
```

### **Ejemplo 3: Menú/Navegación**

```javascript
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function Navigation() {
  const { t } = useTranslation();
  
  return (
    <nav>
      <Link to="/dashboard">{t('nav.dashboard')}</Link>
      <Link to="/trading">{t('nav.trading')}</Link>
      <Link to="/my-wallet">{t('nav.my_wallet')}</Link>
      <Link to="/market">{t('nav.market')}</Link>
    </nav>
  );
}
```

### **Ejemplo 4: Notificaciones**

```javascript
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

function MyComponent() {
  const { t } = useTranslation();
  
  const handleSuccess = () => {
    toast.success(t('notifications.order_placed'));
  };
  
  const handleError = () => {
    toast.error(t('notifications.error_placing_order'));
  };
  
  return <button onClick={handleSuccess}>Place Order</button>;
}
```

### **Ejemplo 5: Tabla de Trading**

```javascript
import { useTranslation } from 'react-i18next';

function TradesTable() {
  const { t } = useTranslation();
  
  return (
    <table>
      <thead>
        <tr>
          <th>{t('trading.side')}</th>
          <th>{t('trading.price')}</th>
          <th>{t('trading.amount')}</th>
          <th>{t('trading.time')}</th>
        </tr>
      </thead>
      <tbody>
        {/* ... */}
      </tbody>
    </table>
  );
}
```

---

## 🎨 **CAMBIAR IDIOMA PROGRAMÁTICAMENTE**

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const changeToEnglish = () => {
    i18n.changeLanguage('en');
  };
  
  const changeToSpanish = () => {
    i18n.changeLanguage('es');
  };
  
  const changeToPortuguese = () => {
    i18n.changeLanguage('pt');
  };
  
  return (
    <div>
      <button onClick={changeToSpanish}>Español</button>
      <button onClick={changeToEnglish}>English</button>
      <button onClick={changeToPortuguese}>Português</button>
    </div>
  );
}
```

---

## 📦 **AGREGAR NUEVAS TRADUCCIONES**

### **1. Edita los archivos JSON:**

- `src/i18n/locales/es.json` (Español)
- `src/i18n/locales/en.json` (Inglés)
- `src/i18n/locales/pt.json` (Português)

### **2. Agrega la nueva clave:**

```json
// src/i18n/locales/es.json
{
  "mi_nueva_seccion": {
    "mi_nuevo_texto": "Mi Texto en Español"
  }
}
```

```json
// src/i18n/locales/en.json
{
  "mi_nueva_seccion": {
    "mi_nuevo_texto": "My Text in English"
  }
}
```

```json
// src/i18n/locales/pt.json
{
  "mi_nueva_seccion": {
    "mi_nuevo_texto": "Meu Texto em Português"
  }
}
```

### **3. Úsalo en tu componente:**

```javascript
const { t } = useTranslation();

<h1>{t('mi_nueva_seccion.mi_nuevo_texto')}</h1>
```

---

## 🔄 **INTERPOLACIÓN (Variables en Texto)**

### **1. Define en el JSON:**

```json
{
  "welcome_user": "Bienvenido, {{name}}!",
  "balance_info": "Tu balance es {{amount}} {{currency}}"
}
```

### **2. Usa con variables:**

```javascript
const { t } = useTranslation();
const userName = "Juan";
const balance = 1000;

<h1>{t('welcome_user', { name: userName })}</h1>
<p>{t('balance_info', { amount: balance, currency: 'USDC' })}</p>

// Resultado:
// "Bienvenido, Juan!"
// "Tu balance es 1000 USDC"
```

---

## 🌐 **DETECCIÓN AUTOMÁTICA DE IDIOMA**

El sistema detecta automáticamente el idioma del navegador del usuario.

**Orden de detección:**
1. Idioma guardado en `localStorage`
2. Idioma del navegador
3. Español (fallback)

---

## 💾 **PERSISTENCIA**

El idioma seleccionado se **guarda automáticamente** en `localStorage` con la clave `i18nextLng`.

Cuando el usuario vuelve a visitar la app, el idioma se carga automáticamente.

---

## 🚀 **AGREGAR MÁS IDIOMAS**

### **1. Crea el archivo de traducción:**

```bash
src/i18n/locales/zh.json  # Chino
src/i18n/locales/ja.json  # Japonés
src/i18n/locales/fr.json  # Francés
```

### **2. Agrega al config:**

```javascript
// src/i18n/config.js
import translationZH from './locales/zh.json';

const resources = {
  es: { translation: translationES },
  en: { translation: translationEN },
  pt: { translation: translationPT },
  zh: { translation: translationZH }, // Nuevo
};
```

### **3. Agrega al selector:**

```javascript
// src/jsx/components/LanguageSelector.js
const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }, // Nuevo
];
```

---

## 📊 **CATEGORÍAS DISPONIBLES**

- `common` - Textos comunes (loading, error, buttons, etc.)
- `nav` - Navegación/menú
- `trading` - Trading y órdenes
- `wallet` - Billetera y balances
- `market` - Mercado y pares
- `dashboard` - Dashboard/Panel
- `auth` - Autenticación/Login
- `websocket` - Estado de WebSocket
- `notifications` - Notificaciones
- `timeframes` - Periodos de tiempo (1m, 5m, 1h, etc.)
- `settings` - Configuraciones

---

## 🐛 **DEBUGGING**

### **Ver idioma actual:**
```javascript
const { i18n } = useTranslation();
console.log('Idioma actual:', i18n.language);
```

### **Ver todas las traducciones cargadas:**
```javascript
console.log('Traducciones:', i18n.store.data);
```

### **Activar modo debug:**
```javascript
// src/i18n/config.js
i18n.init({
  debug: true, // Cambia a true para ver logs
  // ...
});
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

Para traducir un componente existente:

1. ✅ Importar `useTranslation`
2. ✅ Extraer la función `t`
3. ✅ Reemplazar textos hardcodeados con `t('clave')`
4. ✅ Verificar que las claves existen en los 3 idiomas (ES, EN, PT)
5. ✅ Probar cambiando de idioma

---

## 📱 **EJEMPLO COMPLETO: Trading Component**

```javascript
import React from 'react';
import { useTranslation } from 'react-i18next';

function TradingComponent() {
  const { t } = useTranslation();
  
  return (
    <div className="trading-panel">
      <h2>{t('nav.trading')}</h2>
      
      <div className="order-form">
        <div className="form-group">
          <label>{t('trading.price')}</label>
          <input 
            type="number" 
            placeholder={t('trading.price')}
          />
        </div>
        
        <div className="form-group">
          <label>{t('trading.amount')}</label>
          <input 
            type="number" 
            placeholder={t('trading.amount')}
          />
        </div>
        
        <div className="button-group">
          <button className="btn btn-success">
            {t('trading.buy')}
          </button>
          <button className="btn btn-danger">
            {t('trading.sell')}
          </button>
        </div>
      </div>
      
      <div className="order-book">
        <h3>{t('trading.order_book')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('trading.price')}</th>
              <th>{t('trading.amount')}</th>
              <th>{t('common.total')}</th>
            </tr>
          </thead>
          {/* ... */}
        </table>
      </div>
    </div>
  );
}

export default TradingComponent;
```

---

## 🎯 **BUENAS PRÁCTICAS**

1. ✅ **Usa claves descriptivas**: `trading.buy` en lugar de `buy`
2. ✅ **Agrupa por categoría**: `nav.*`, `trading.*`, `wallet.*`
3. ✅ **Mantén consistencia**: Usa el mismo formato en los 3 idiomas
4. ✅ **No hardcodees textos**: Siempre usa `t()`
5. ✅ **Documenta claves nuevas**: Agrega comentarios si es necesario
6. ✅ **Prueba todos los idiomas**: Cambia y verifica que se vea bien

---

**¡El sistema de multi-idioma está listo para usar!** 🌍✨

Para cualquier duda, revisa los archivos de ejemplo o la documentación oficial de react-i18next: https://react.i18next.com/

