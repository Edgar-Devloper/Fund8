import Slider from "react-slick";
//import "slick-carousel/slick/slick.css";
//import "slick-carousel/slick/slick-theme.css";
import {Link} from 'react-router-dom';

import pic2 from './../../../../images/contacts/pic-2.jpg';
import pic3 from './../../../../images/contacts/pic-3.jpg';
import pic4 from './../../../../images/contacts/pic-4.jpg';
import pic5 from './../../../../images/contacts/pic-5.jpg';
import pic7 from './../../../../images/contacts/pic-7.jpg';

const TestimonialOwl = ({ contacts, selectedContact, onContactSelect }) => {
	// default contacts if not provided
	const defaultContacts = [
		{ id: 1, name: "Samuel", username: "@sam224", pic: pic5 },
		{ id: 2, name: "Cindy", username: "@cindyss", pic: pic2 },
		{ id: 3, name: "David", username: "@davidxc", pic: pic3 },
		{ id: 4, name: "Martha", username: "@marthaa", pic: pic4 },
		{ id: 5, name: "Olivia", username: "@oliv62", pic: pic7 },
	];
	
	const contactList = contacts || defaultContacts;
	const picMap = { 1: pic5, 2: pic2, 3: pic3, 4: pic4, 5: pic7 };
	const settings = {
		dots: false,
		infinite: true,
		arrows: false,
		speed: 500,
		slidesToShow: 4,
		slidesToScroll: 1,
		responsive: [
			{
				breakpoint: 1600,
				settings: {
				  slidesToShow: 5,
				  slidesToScroll: 1,
				  
				},
			},
			{
				breakpoint: 1024,
				settings: {
				  slidesToShow: 4,
				  slidesToScroll: 1,				  
				},
			},
			
			{
				breakpoint: 768,
				settings: {
				  slidesToShow: 3,
				  slidesToScroll: 1,
				},
			},
			{
				breakpoint: 400,
				settings: {
				  slidesToShow: 2,
				  slidesToScroll: 1,
				},
			},
		],
	};
	const handleContactClick = (contact) => {
		if (onContactSelect) {
			onContactSelect(contact);
		}
	};

	return(
		<>
			<Slider className="testimonial-two px-4 owl-carousel contacts-slider" {...settings}>
				{contactList.map((contact) => {
					const pic = contact.pic || picMap[contact.id] || pic5;
					const isSelected = selectedContact?.id === contact.id;
					return (
						<div 
							key={contact.id} 
							className="items"
							onClick={() => handleContactClick(contact)}
							style={{ cursor: 'pointer', opacity: isSelected ? 1 : 0.7 }}
						>
							<div className="text-center">
								<img 
									className={`mb-3 rounded-circle mx-auto ${isSelected ? 'border border-primary' : ''}`}
									src={pic} 
									alt={contact.name}
									style={{ borderWidth: isSelected ? '3px' : '0' }}
								/>
								<h5 className="mb-0">
									<Link 
										to={"#"} 
										className={`text-black ${isSelected ? 'fw-bold' : ''}`}
										onClick={(e) => {
											e.preventDefault();
											handleContactClick(contact);
										}}
									>
										{contact.name}
									</Link>
								</h5>
								<span className="fs-12">{contact.username}</span>
							</div>
						</div>
					);
				})}
			</Slider>
		</>
	)
}
export default TestimonialOwl;