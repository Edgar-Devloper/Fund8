import {
    LOADING_TOGGLE_ACTION,
    LOGIN_CONFIRMED_ACTION,
    LOGIN_FAILED_ACTION,
    LOGOUT_ACTION,
    SIGNUP_CONFIRMED_ACTION,
    SIGNUP_FAILED_ACTION,
    TRADING_PORTAL_CREATED_ACTION,
    TRADING_PORTAL_VERIFIED_ACTION,
    TRADING_PORTAL_LOADED_ACTION,
} from '../actions/AuthActions';

const initialState = {
    auth: {
        email: '',
        idToken: '',
        localId: '',
        expiresIn: '',
        refreshToken: '',
    },
    tradingPortal: {
        hasPortalAccount: false,
        fullName: '',
        email: '',
        isVerified: false,
    },
    errorMessage: '',
    successMessage: '',
    showLoading: false,
};

export function AuthReducer(state = initialState, action) {
    if (action.type === SIGNUP_CONFIRMED_ACTION) {
        return {
            ...state,
            auth: action.payload,
            errorMessage: '',
            successMessage: 'Signup Successfully Completed',
            showLoading: false,
        };
    }
    if (action.type === LOGIN_CONFIRMED_ACTION) {
        return {
            ...state,
            auth: action.payload,
            errorMessage: '',
            successMessage: 'Login Successfully Completed',
            showLoading: false,
        };
    }

    if (
        action.type === SIGNUP_FAILED_ACTION ||
        action.type === LOGIN_FAILED_ACTION
    ) {
        return {
            ...state,
            errorMessage: action.payload,
            successMessage: '',
            showLoading: false,
        };
    }

    if (action.type === LOADING_TOGGLE_ACTION) {
        return {
            ...state,
            showLoading: action.payload,
        };
    }

    if (action.type === TRADING_PORTAL_CREATED_ACTION) {
        return {
            ...state,
            tradingPortal: {
                hasPortalAccount: true,
                fullName: action.payload.fullName || '',
                email: action.payload.email || '',
                isVerified: action.payload.isVerified || false,
            },
            errorMessage: '',
            successMessage: 'Trading Portal account created successfully',
        };
    }

    if (action.type === TRADING_PORTAL_VERIFIED_ACTION) {
        return {
            ...state,
            tradingPortal: {
                ...state.tradingPortal,
                isVerified: true,
            },
        };
    }

    if (action.type === TRADING_PORTAL_LOADED_ACTION) {
        return {
            ...state,
            tradingPortal: {
                hasPortalAccount: true,
                fullName: action.payload.fullName || '',
                email: action.payload.email || '',
                isVerified: action.payload.isVerified || false,
            },
        };
    }

    if (action.type === LOGOUT_ACTION) {
        return {
            ...state,
            errorMessage: '',
            successMessage: '',
            auth: {
                email: '',
                idToken: '',
                localId: '',
                expiresIn: '',
                refreshToken: '',
            },
            // Mantener hasPortalAccount porque el usuario sigue teniendo cuenta
            // Solo limpiar isVerified (el login)
            tradingPortal: {
                ...state.tradingPortal,
                isVerified: false,
            },
        };
    }

    return state;
}

    
