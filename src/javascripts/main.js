(function () {
    'use strict';

    // load dependencies
    var animationControl = require('./animation-control.js');


    $(document).ready(function () {
        var $upArrow = $('.up-arrow');

        // init Swiper
        var mySwiper = new Swiper('.swiper-container', {
//      	noSwiper: true,
//      	initialSlide:4,
        	
            mousewheelControl: true,
            effect: 'coverflow',    // slide, fade, coverflow or flip
            speed: 400,
            direction: 'vertical',
            fade: {
                crossFade: false
            },
            coverflow: {
                rotate: 100,
                stretch: 0,
                depth: 300,
                modifier: 1,
                slideShadows: false     // do disable shadows for better performance
            },
            flip: {
                limitRotation: true,
                slideShadows: false     // do disable shadows for better performance
            },
            onInit: function (swiper) {
                animationControl.initAnimationItems();  // get items ready for animations
                animationControl.playAnimation(swiper); // play animations of the first slide
            },
            onTransitionStart: function (swiper) {     // on the last slide, hide .btn-swipe
                if (swiper.activeIndex === swiper.slides.length - 1) {
                    $upArrow.hide();
                } else {
                    $upArrow.show();
                }
            },
            onTransitionEnd: function (swiper) {       // play animations of the current slide
                animationControl.playAnimation(swiper);
            }
        });

        // hide loading animation since everything is ready
        $('.loading-overlay').slideUp();
        
        $(".slide-1 button.animated").click(function(){
        	mySwiper.slideTo(1,400);
        })
    });
})();
