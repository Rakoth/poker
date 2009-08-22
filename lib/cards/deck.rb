module Poker
  class Deck
    attr_reader :cards

    def initialize create_cards = true
			if create_cards
				@cards = Card::SUITS.map do |suit|
					Card::FACES.map do |value|
						Card.new(suit, value)
					end
				end.flatten
				@card_index = 0
			end
    end

    def shuffle
      @cards = @cards.sort_by {rand}
      @card_index = 0
      self
    end

    def next(quantity = 1)
      raise IndexError if @card_index + quantity > 52
      @cards[@card_index...(@card_index += quantity)]
    end

		def dump
			"#{@card_index},#{@cards.map(&:dump).join(':')}"
		end

		def self.load string
			deck = string.split(',')
			new_deck = self.new(false)
			new_deck.send(:card_index=, deck.first.to_i)
			new_deck.send(:cards=, deck.last.split(':').map{|card| Poker::Card.load card})
			new_deck
		end

    private

    attr_writer :cards
    attr_writer :card_index
  end
end
