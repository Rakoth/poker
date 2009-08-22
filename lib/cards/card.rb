module Poker
  class Card
    include Comparable

    SUITS = ['Spades', 'Diamonds', 'Clubs', 'Hearts']

		SHORT_SUITS = {
			'S' => 'Spades',
			'D' => 'Diamonds',
			'C' => 'Clubs',
			'H' => 'Hearts'
		}

		SHORT_VALUES = {
			'A' => 14,
      'K' => 13,
      'Q' => 12,
      'J' => 11,
      'T' => 10,
      '9' => 9,
      '8' => 8,
      '7' => 7,
      '6' => 6,
      '5' => 5,
      '4' => 4,
      '3' => 3,
      '2' => 2
		}

    VALUES = {
      'Ace' => 14,
      'King' => 13,
      'Queen' => 12,
      'Jack' => 11,
      '10' => 10,
      '9' => 9,
      '8' => 8,
      '7' => 7,
      '6' => 6,
      '5' => 5,
      '4' => 4,
      '3' => 3,
      '2' => 2
    }
    FACES = VALUES.keys

    attr_reader :value, :suit

    def initialize(suit, face_or_value)
      self.suit = suit
      self.value = VALUES[face_or_value] || face_or_value
      raise ArgumentError unless SUITS.include?(suit) && VALUES.has_value?(value)
    end

    def face
      VALUES.index(value)
    end

    def <=> other_card
      value <=> other_card.value
    end

		def short_suit
			SHORT_SUITS.index suit
		end

		def short_fase
			SHORT_VALUES.index value
		end

		def to_s
			short_suit + short_fase
		end

		def dump
			to_s
		end

		def self.load string
			self.new SHORT_SUITS[string.first], SHORT_VALUES[string.last]
		end


    private
      attr_writer :value, :suit
  end
end
