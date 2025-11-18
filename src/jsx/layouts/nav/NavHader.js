import React, { Fragment, useState } from "react";
/// React router dom
import { Link } from "react-router-dom";
// import { ThemeContext } from "../../../context/ThemeContext"; // ya no se usa para el logo

// Importa las imágenes reales proporcionadas
// Nota: este archivo está en src/jsx/layouts/nav, por eso subimos tres niveles (../../../) para volver a src/
import logoIcon from "../../../images/logo192.png";        // Icono principal (isotipo)
import logoWordmark from "../../../images/logo-purple.png";  // Wordmark (nombre de la marca)

export function  NavMenuToggle(){
	setTimeout(()=>{	
		let mainwrapper = document.querySelector("#main-wrapper");
		if(mainwrapper.classList.contains('menu-toggle')){
			mainwrapper.classList.remove("menu-toggle");
		}else{
			mainwrapper.classList.add("menu-toggle");
		}
	},200);
}

const NavHader = () => {
  const [toggle, setToggle] = useState(false);
  return (
    <div className="nav-header">
      <Link to="/dashboard" className="brand-logo" aria-label="Inicio">
        <Fragment>
          <img
            src={logoIcon}
            alt="Logo"
            className="logo-abbr"
            width={48}
            height={48}
            style={{ objectFit: 'contain', display: 'inline-block' }}
          />
          <img
            src={logoWordmark}
            alt="Nombre de la marca"
            className="brand-title"
            height={26}
            style={{ marginLeft: 8, objectFit: 'contain', display: 'inline-block' }}
          />
        </Fragment>
      </Link>

      <div
        className="nav-control"
        onClick={() => {
          setToggle(!toggle);
          //openMenuToggle();
          NavMenuToggle();
        }}
      >
        <div className={`hamburger ${toggle ? "is-active" : ""}`}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
      </div>
    </div>
  );
};

export default NavHader;
