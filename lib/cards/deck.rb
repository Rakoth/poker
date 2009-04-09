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

#		def self._load from_string
#			new_deck = Poker::Deck.new(false)
#			dump_deck = from_string.split(' ')
#			new_deck.card_index = dump_deck[0]
#			new_deck.cards = dump_deck[1].split(';').map do |card|
#				suite_and_value = card.split(':')
#				Card.new suite_and_value[0], suite_and_value[1]
#			end
#			new_deck
#		end
#
#		def _dump
#			@card_index.to_s + ' ' + @cards.map{|card| card.suite.to_s + ':' + card.value.to_s}.join(';')
#		end
#
#		def to_yaml
#			[@card_index, self.cards.map {|card| card.suit[0..0] + card.value.to_s}].to_yaml
#		end

    private

    attr_writer :cards
    attr_writer :card_index
  end
end
