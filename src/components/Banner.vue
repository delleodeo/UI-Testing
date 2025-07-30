<script setup lang="js">
import { reactive, ref } from 'vue';

const promo = reactive({
    headline: 'Get ',
    highlight: 'free delivery',
    afterHighlight: ' on shopping over ₱200',
    description: 'Enjoy the freshest pasalubong and local delicacies delivered right to your doorstep. Experience the joy of hassle-free shopping with DoroShop.',
    cta: 'Shop Now →',
    imageUrl: "https://i.pinimg.com/736x/bb/0b/c5/bb0bc5c210fc6cc315206811ce5fe131.jpg",
    imageAlt: 'Basket of fresh fruits and vegetables'
});


</script>


<template>
    <main>
        <section class="promo-banner">
            <div class="promo-content">
                <h1 class="promo-title">
                    {{ promo.headline }}
                    <span class="highlight">{{ promo.highlight }}</span>
                    {{ promo.afterHighlight }}
                </h1>
                <p class="promo-description">
                    {{ promo.description }}
                </p>
                <button class="promo-cta">{{ promo.cta }}</button>
            </div>

            <div class="promo-image">
                <img src="../assets/fruit.png" loading="lazy" height="200" width="300" :alt="promo.imageAlt" />
            </div>
        </section>
    </main>
</template>

<style scoped>
main {
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 5.5rem;
    padding: 0px 10px;
    margin-bottom: .3rem;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.promo-banner {
    animation: fadeIn .15s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    background: linear-gradient(135deg, #cfee7a, #f8cf2a);
    border-radius: 1rem;
    overflow: hidden;
    width: 100%;
    max-width: 100%;
    height: fit-content;

    padding: 2.5rem 2rem;
}

.promo-content {
    flex: 1;
    text-align: left;
    max-width: 70%;
}

.promo-title {
    font-size: clamp(1.5rem, 4vw, 3rem);
    font-weight: 800;
    color: #1f2937;
    /* gray-800 */
    min-width: 20ch;
}

.highlight {
    color: var(--secondary-color);
    /* amber-500 */
}

.promo-description {
    margin-top: 1rem;
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: #374151;
    /* gray-700 */
}

.promo-cta {
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    background-color: var(--secondary-color);
    /* amber-500 */
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.3s;
}

.promo-cta:hover {
    transform: scale(1.05);
}

.promo-image {
    display: flex;
    justify-content: center;
    position: relative;
    flex: 1;
    height: 10rem;
    z-index: 1;
}

.promo-image img {
    width: 30vw;
    height: auto;
    object-fit: cover;
    border-radius: 1rem;
    min-width: 17rem;
    position: absolute;
    bottom: -7vw;
    right: -1rem;
    transition: all 150ms;

}

@media (max-width: 1200px) {
    .promo-banner {
        border-radius: 0 0 1rem 1rem;
        
    }

    main {
        padding: 0px;
        margin-top: 4.5rem;
    }
}

/* Responsive layout */
@media (min-width: 768px) {

    .promo-banner {
        flex-direction: row;
        text-align: left;

    }
}


@media (max-width: 830px) {
    .promo-description {
        display: none;
    }

    main {
        margin-top: 4rem;
    }

    .promo-banner {
        padding: 2.5rem 1rem;
    }


    .promo-image img {
        right: -1rem;
    }
}

@media (max-width: 680px) {
    .promo-image img {
        right: -3rem;
    }
}

@media (max-width: 620px) {
    .promo-image img {
        right: -3rem;
        min-width: 15rem;
        bottom: -3rem;
        transform: rotate(-30deg);

    }

    .promo-banner {
        padding: 1rem;
    }
}

@media (max-width: 520px) {
    .promo-image img {
        right: -3rem;
        min-width: 12.5rem;
        bottom: -3rem;
        transform: rotate(-30deg);
    }
}
</style>
