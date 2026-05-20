const request = require('supertest');

const mockPrisma = {
  movie: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => mockPrisma);

jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 'user-123' };
    next();
  };
});

const app = require('../server');
const prisma = require('../lib/prisma');

describe('API de Rating de Peliculas', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/movies/:id/rating', () => {
    it('should rate a movie with a valid score of 3', async () => {
      const existingMovie = {
        id: 'movie-1',
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        posterUrl: 'https://example.com/inception.jpg',
        isFavorite: false,
        rating: 0,
        ownerId: 'user-123',
      };

      const updatedMovie = {
        ...existingMovie,
        rating: 3,
      };

      prisma.movie.findFirst.mockResolvedValue(existingMovie);
      prisma.movie.update.mockResolvedValue(updatedMovie);

      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3 });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(3);
      expect(prisma.movie.findFirst).toHaveBeenCalledWith({
        where: { id: 'movie-1', ownerId: 'user-123' },
      });
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { rating: 3 },
      });
    });

    it('should rate a movie with maximum score 5', async () => {
      const existingMovie = {
        id: 'movie-2',
        title: 'The Matrix',
        director: 'Wachowski Sisters',
        year: 1999,
        posterUrl: 'https://example.com/matrix.jpg',
        isFavorite: true,
        rating: 4,
        ownerId: 'user-123',
      };

      const updatedMovie = {
        ...existingMovie,
        rating: 5,
      };

      prisma.movie.findFirst.mockResolvedValue(existingMovie);
      prisma.movie.update.mockResolvedValue(updatedMovie);

      const response = await request(app)
        .patch('/api/movies/movie-2/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(5);
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-2' },
        data: { rating: 5 },
      });
    });

    it('should allow setting rating to 0', async () => {
      const existingMovie = {
        id: 'movie-3',
        title: 'Interstellar',
        director: 'Christopher Nolan',
        year: 2014,
        posterUrl: 'https://example.com/interstellar.jpg',
        isFavorite: false,
        rating: 4,
        ownerId: 'user-123',
      };

      const updatedMovie = { ...existingMovie, rating: 0 };

      prisma.movie.findFirst.mockResolvedValue(existingMovie);
      prisma.movie.update.mockResolvedValue(updatedMovie);

      const response = await request(app)
        .patch('/api/movies/movie-3/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 0 });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(0);
    });

    it('should return 400 when rating is greater than 5', async () => {
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('should return 400 when rating is less than 0', async () => {
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('should return 400 when rating is not an integer', async () => {
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3.5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('should return 400 when rating is missing', async () => {
      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rating debe estar entre 0 y 5');
    });

    it('should return 404 when the movie does not exist', async () => {
      prisma.movie.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/movies/no-existe/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3 });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Pel\u00edcula no encontrada');
      expect(prisma.movie.update).not.toHaveBeenCalled();
    });

    it('should return 500 when an internal error occurs', async () => {
      prisma.movie.findFirst.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .patch('/api/movies/movie-1/rating')
        .set('Authorization', 'Bearer fake-token')
        .send({ rating: 3 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('No se pudo calificar la pel\u00edcula');
    });
  });
});
