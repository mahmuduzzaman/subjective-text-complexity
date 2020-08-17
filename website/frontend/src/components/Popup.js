import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle } from '@fortawesome/free-regular-svg-icons'
import '../styles/Popup.css'

const Popup = props => {
  return (
    <div className="popup">
      <div className="popup-inner">
        <div className="popup-close" onClick={() => props.onClose()}>
          <span>
            <FontAwesomeIcon icon={faTimesCircle} />
          </span>
        </div>
        <div className="popup-content">{props.children}</div>
      </div>
    </div>
  )
}

Popup.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element,
    PropTypes.string,
  ]),
  onClose: PropTypes.func.isRequired,
}

export default Popup
