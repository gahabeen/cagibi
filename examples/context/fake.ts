import { faker } from '@faker-js/faker';

export const product = (product: any = {}) => ({
    id: faker.datatype.uuid(),
    name: faker.commerce.productName(),
    price: faker.commerce.price(),
    description: faker.lorem.paragraph(),
    image: faker.image.imageUrl(),
    rating: faker.datatype.number({ min: 1, max: 5 }),
    // reviews: [],
    // relatedProducts: [],
    ...product,
})

export const review = (review: any = {}) => ({
    id: faker.datatype.uuid(),
    comment: faker.lorem.sentence(),
    ...review,
});

export const user = (user: any = {}) => ({
    id: faker.datatype.uuid(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    password: faker.internet.password(),
    birthdate: faker.date.birthdate(),
    registeredAt: faker.date.past(),
    ...user,
})
