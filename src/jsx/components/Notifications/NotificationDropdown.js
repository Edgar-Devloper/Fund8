/**
 * NotificationDropdown - Componente de dropdown de notificaciones
 * Muestra notificaciones reales del sistema de trading
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useNotifications } from '../../../context/NotificationContext.js';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  // Formatear tiempo relativo
  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Obtener icono según tipo
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <i className="fa fa-check-circle text-success" />;
      case 'error':
        return <i className="fa fa-exclamation-circle text-danger" />;
      case 'warning':
        return <i className="fa fa-exclamation-triangle text-warning" />;
      case 'order':
        return <i className="fa fa-shopping-cart text-primary" />;
      case 'trade':
        return <i className="fa fa-exchange text-info" />;
      default:
        return <i className="fa fa-info-circle text-info" />;
    }
  };

  // Obtener clase de media según tipo
  const getMediaClass = (type) => {
    switch (type) {
      case 'success':
        return 'media-success';
      case 'error':
        return 'media-danger';
      case 'warning':
        return 'media-warning';
      case 'order':
      case 'trade':
        return 'media-primary';
      default:
        return 'media-info';
    }
  };

  return (
    <Dropdown as="li" className="nav-item notification_dropdown">
      <Dropdown.Toggle
        variant=""
        as="a"
        className="nav-link ai-icon i-false c-pointer"
        role="button"
        data-toggle="dropdown"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.75 15.8385V13.0463C22.7471 10.8855 21.9385 8.80353 20.4821 7.20735C19.0258 5.61116 17.0264 4.61555 14.875 4.41516V2.625C14.875 2.39294 14.7828 2.17038 14.6187 2.00628C14.4546 1.84219 14.2321 1.75 14 1.75C13.7679 1.75 13.5454 1.84219 13.3813 2.00628C13.2172 2.17038 13.125 2.39294 13.125 2.625V4.41534C10.9736 4.61572 8.97429 5.61131 7.51794 7.20746C6.06159 8.80361 5.25291 10.8855 5.25 13.0463V15.8383C4.26257 16.0412 3.37529 16.5784 2.73774 17.3593C2.10019 18.1401 1.75134 19.1169 1.75 20.125C1.75076 20.821 2.02757 21.4882 2.51969 21.9803C3.01181 22.4724 3.67904 22.7492 4.375 22.75H9.71346C9.91521 23.738 10.452 24.6259 11.2331 25.2636C12.0142 25.9013 12.9916 26.2497 14 26.2497C15.0084 26.2497 15.9858 25.9013 16.7669 25.2636C17.548 24.6259 18.0848 23.738 18.2865 22.75H23.625C24.321 22.7492 24.9882 22.4724 25.4803 21.9803C25.9724 21.4882 26.2492 20.821 26.25 20.125C26.2486 19.117 25.8998 18.1402 25.2622 17.3594C24.6247 16.5786 23.7374 16.0414 22.75 15.8385ZM7 13.0463C7.00232 11.2113 7.73226 9.45223 9.02974 8.15474C10.3272 6.85726 12.0863 6.12732 13.9212 6.125H14.0788C15.9137 6.12732 17.6728 6.85726 18.9703 8.15474C20.2677 9.45223 20.9977 11.2113 21 13.0463V15.75H7V13.0463ZM14 24.5C13.4589 24.4983 12.9316 24.3292 12.4905 24.0159C12.0493 23.7026 11.716 23.2604 11.5363 22.75H16.4637C16.284 23.2604 15.9507 23.7026 15.5095 24.0159C15.0684 24.3292 14.5411 24.4983 14 24.5ZM23.625 21H4.375C4.14298 20.9999 3.9205 20.9076 3.75644 20.7436C3.59237 20.5795 3.50014 20.357 3.5 20.125C3.50076 19.429 3.77757 18.7618 4.26969 18.2697C4.76181 17.7776 5.42904 17.5008 6.125 17.5H21.875C22.571 17.5008 23.2382 17.7776 23.7303 18.2697C24.2224 18.7618 24.4992 19.429 24.5 20.125C24.4999 20.357 24.4076 20.5795 24.2436 20.7436C24.0795 20.9076 23.857 20.9999 23.625 21Z"
            fill="#342E59"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="badge light text-white bg-primary rounded-circle">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu
        align="right"
        className="mt-2 dropdown-menu dropdown-menu-end"
      >
        <div className="notification_title d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="mb-0">Notifications</h5>
          {unreadCount > 0 && (
            <button
              className="btn btn-sm btn-link text-primary p-0"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
        <PerfectScrollbar className="widget-media dz-scroll p-3 height380">
          {notifications.length === 0 ? (
            <div className="text-center py-4">
              <i className="fa fa-bell-slash fa-2x text-muted mb-2" />
              <p className="text-muted mb-0">No hay notificaciones</p>
            </div>
          ) : (
            <ul className="timeline">
              {notifications.slice(0, 10).map((notification) => (
                <li
                  key={notification.id}
                  className={!notification.read ? 'unread' : ''}
                  onClick={() => markAsRead(notification.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="timeline-panel">
                    <div className={`media me-2 ${getMediaClass(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="media-body">
                      <h6 className="mb-1">{notification.title}</h6>
                      <p className="mb-1 text-muted small">{notification.message}</p>
                      <small className="d-block text-muted">
                        {formatTime(notification.timestamp)}
                      </small>
                    </div>
                    {!notification.read && (
                      <span className="badge badge-primary badge-sm">New</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PerfectScrollbar>
        {notifications.length > 0 && (
          <Link className="all-notification" to="#">
            See all notifications <i className="ti-arrow-right" />
          </Link>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdown;

