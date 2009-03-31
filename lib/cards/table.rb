module Poker
  class Table
    
    attr_accessor :deck, :hands
    
    def initialize(size)
      @deck = Deck.new
      @hands = @deck.deal(size)
    end
    
    def winner
      #TODO: Make it possible for more than one hand to win.
      sorted_hands = @hands.sort
      
      [@hands.index(sorted_hands.last), sorted_hands.last]
    end
  end
end
